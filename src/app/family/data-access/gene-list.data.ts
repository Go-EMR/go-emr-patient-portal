// =============================================================================
// Curated Gene List — Task 15
// ~50 clinically significant genes for genetic test autocomplete
// =============================================================================

export interface CuratedGene {
  name: string;
  fullName: string;
  associatedConditions: string[];
}

export const CURATED_GENES: CuratedGene[] = [
  {
    name: 'BRCA1',
    fullName: 'Breast Cancer Gene 1',
    associatedConditions: ['Breast cancer', 'Ovarian cancer', 'Fallopian tube cancer'],
  },
  {
    name: 'BRCA2',
    fullName: 'Breast Cancer Gene 2',
    associatedConditions: ['Breast cancer', 'Ovarian cancer', 'Pancreatic cancer', 'Prostate cancer'],
  },
  {
    name: 'TP53',
    fullName: 'Tumour Protein p53',
    associatedConditions: ['Li-Fraumeni syndrome', 'Multiple cancers', 'Breast cancer'],
  },
  {
    name: 'APC',
    fullName: 'Adenomatous Polyposis Coli',
    associatedConditions: ['Familial adenomatous polyposis', 'Colon cancer'],
  },
  {
    name: 'MLH1',
    fullName: 'MutL Homolog 1',
    associatedConditions: ['Lynch syndrome', 'Colorectal cancer', 'Endometrial cancer'],
  },
  {
    name: 'MSH2',
    fullName: 'MutS Homolog 2',
    associatedConditions: ['Lynch syndrome', 'Colorectal cancer', 'Ovarian cancer'],
  },
  {
    name: 'MSH6',
    fullName: 'MutS Homolog 6',
    associatedConditions: ['Lynch syndrome', 'Colorectal cancer', 'Endometrial cancer'],
  },
  {
    name: 'PMS2',
    fullName: 'PMS1 Homolog 2',
    associatedConditions: ['Lynch syndrome', 'Colorectal cancer'],
  },
  {
    name: 'CFTR',
    fullName: 'Cystic Fibrosis Transmembrane Conductance Regulator',
    associatedConditions: ['Cystic fibrosis', 'Congenital absence of vas deferens'],
  },
  {
    name: 'HBB',
    fullName: 'Haemoglobin Subunit Beta',
    associatedConditions: ['Sickle cell disease', 'Beta-thalassaemia'],
  },
  {
    name: 'HBA1',
    fullName: 'Haemoglobin Subunit Alpha 1',
    associatedConditions: ['Alpha-thalassaemia'],
  },
  {
    name: 'HBA2',
    fullName: 'Haemoglobin Subunit Alpha 2',
    associatedConditions: ['Alpha-thalassaemia'],
  },
  {
    name: 'HTT',
    fullName: 'Huntingtin',
    associatedConditions: ["Huntington's disease"],
  },
  {
    name: 'FMR1',
    fullName: 'Fragile X Messenger Ribonucleoprotein 1',
    associatedConditions: ['Fragile X syndrome', 'Fragile X-associated tremor/ataxia syndrome'],
  },
  {
    name: 'HEXA',
    fullName: 'Hexosaminidase Subunit Alpha',
    associatedConditions: ['Tay-Sachs disease'],
  },
  {
    name: 'GBA',
    fullName: 'Glucocerebrosidase',
    associatedConditions: ['Gaucher disease', "Parkinson's disease risk"],
  },
  {
    name: 'LMNA',
    fullName: 'Lamin A/C',
    associatedConditions: ['Familial dilated cardiomyopathy', 'Emery-Dreifuss muscular dystrophy', 'Progeria'],
  },
  {
    name: 'MYH7',
    fullName: 'Myosin Heavy Chain 7',
    associatedConditions: ['Hypertrophic cardiomyopathy', 'Dilated cardiomyopathy'],
  },
  {
    name: 'MYBPC3',
    fullName: 'Myosin Binding Protein C3',
    associatedConditions: ['Hypertrophic cardiomyopathy', 'Dilated cardiomyopathy'],
  },
  {
    name: 'SCN5A',
    fullName: 'Sodium Voltage-Gated Channel Alpha Subunit 5',
    associatedConditions: ['Brugada syndrome', 'Long QT syndrome type 3', 'Dilated cardiomyopathy'],
  },
  {
    name: 'KCNQ1',
    fullName: 'Potassium Voltage-Gated Channel Subfamily Q Member 1',
    associatedConditions: ['Long QT syndrome type 1', 'Short QT syndrome'],
  },
  {
    name: 'KCNH2',
    fullName: 'Potassium Voltage-Gated Channel Subfamily H Member 2',
    associatedConditions: ['Long QT syndrome type 2', 'Short QT syndrome'],
  },
  {
    name: 'LDLR',
    fullName: 'Low Density Lipoprotein Receptor',
    associatedConditions: ['Familial hypercholesterolaemia', 'Coronary artery disease'],
  },
  {
    name: 'PCSK9',
    fullName: 'Proprotein Convertase Subtilisin/Kexin Type 9',
    associatedConditions: ['Familial hypercholesterolaemia', 'Coronary artery disease'],
  },
  {
    name: 'APOB',
    fullName: 'Apolipoprotein B',
    associatedConditions: ['Familial hypercholesterolaemia', 'Hypobetalipoproteinaemia'],
  },
  {
    name: 'PKD1',
    fullName: 'Polycystin 1',
    associatedConditions: ['Autosomal dominant polycystic kidney disease'],
  },
  {
    name: 'PKD2',
    fullName: 'Polycystin 2',
    associatedConditions: ['Autosomal dominant polycystic kidney disease'],
  },
  {
    name: 'RB1',
    fullName: 'Retinoblastoma Transcriptional Corepressor 1',
    associatedConditions: ['Retinoblastoma', 'Osteosarcoma'],
  },
  {
    name: 'VHL',
    fullName: 'Von Hippel-Lindau Tumour Suppressor',
    associatedConditions: ['Von Hippel-Lindau disease', 'Clear cell renal carcinoma', 'Haemangioblastoma'],
  },
  {
    name: 'NF1',
    fullName: 'Neurofibromin 1',
    associatedConditions: ['Neurofibromatosis type 1', 'Café-au-lait spots', 'Lisch nodules'],
  },
  {
    name: 'NF2',
    fullName: 'Neurofibromin 2 (Merlin)',
    associatedConditions: ['Neurofibromatosis type 2', 'Bilateral vestibular schwannomas'],
  },
  {
    name: 'TSC1',
    fullName: 'Tuberous Sclerosis Complex 1 (Hamartin)',
    associatedConditions: ['Tuberous sclerosis complex'],
  },
  {
    name: 'TSC2',
    fullName: 'Tuberous Sclerosis Complex 2 (Tuberin)',
    associatedConditions: ['Tuberous sclerosis complex'],
  },
  {
    name: 'DMD',
    fullName: 'Dystrophin',
    associatedConditions: ['Duchenne muscular dystrophy', 'Becker muscular dystrophy'],
  },
  {
    name: 'SMN1',
    fullName: 'Survival of Motor Neuron 1',
    associatedConditions: ['Spinal muscular atrophy'],
  },
  {
    name: 'FGFR3',
    fullName: 'Fibroblast Growth Factor Receptor 3',
    associatedConditions: ['Achondroplasia', 'Hypochondroplasia', 'Thanatophoric dysplasia'],
  },
  {
    name: 'COL1A1',
    fullName: 'Collagen Type I Alpha 1 Chain',
    associatedConditions: ['Osteogenesis imperfecta', 'Ehlers-Danlos syndrome'],
  },
  {
    name: 'COL1A2',
    fullName: 'Collagen Type I Alpha 2 Chain',
    associatedConditions: ['Osteogenesis imperfecta', 'Ehlers-Danlos syndrome'],
  },
  {
    name: 'FBN1',
    fullName: 'Fibrillin 1',
    associatedConditions: ['Marfan syndrome', 'Ectopia lentis'],
  },
  {
    name: 'PTEN',
    fullName: 'Phosphatase and Tensin Homolog',
    associatedConditions: ['PTEN hamartoma tumour syndrome', 'Cowden syndrome', 'Breast cancer risk'],
  },
  {
    name: 'RET',
    fullName: 'Ret Proto-Oncogene',
    associatedConditions: ['Multiple endocrine neoplasia type 2', 'Medullary thyroid cancer', 'Hirschsprung disease'],
  },
  {
    name: 'MEN1',
    fullName: 'Menin 1',
    associatedConditions: ['Multiple endocrine neoplasia type 1', 'Pancreatic neuroendocrine tumours'],
  },
  {
    name: 'STK11',
    fullName: 'Serine/Threonine Kinase 11',
    associatedConditions: ['Peutz-Jeghers syndrome', 'Colorectal cancer', 'Lung cancer'],
  },
  {
    name: 'PALB2',
    fullName: 'Partner and Localiser of BRCA2',
    associatedConditions: ['Breast cancer', 'Pancreatic cancer', 'Ovarian cancer'],
  },
  {
    name: 'CHEK2',
    fullName: 'Checkpoint Kinase 2',
    associatedConditions: ['Breast cancer', 'Colorectal cancer', 'Prostate cancer'],
  },
  {
    name: 'ATM',
    fullName: 'Ataxia Telangiectasia Mutated',
    associatedConditions: ['Ataxia-telangiectasia', 'Breast cancer risk', 'Pancreatic cancer risk'],
  },
  {
    name: 'MUTYH',
    fullName: 'MutY DNA Glycosylase',
    associatedConditions: ['MUTYH-associated polyposis', 'Colorectal cancer'],
  },
  {
    name: 'BMPR1A',
    fullName: 'Bone Morphogenetic Protein Receptor Type 1A',
    associatedConditions: ['Juvenile polyposis syndrome', 'Colorectal cancer'],
  },
  {
    name: 'SMAD4',
    fullName: 'SMAD Family Member 4',
    associatedConditions: ['Juvenile polyposis syndrome', 'Hereditary haemorrhagic telangiectasia'],
  },
  {
    name: 'F5',
    fullName: 'Coagulation Factor V',
    associatedConditions: ['Factor V Leiden thrombophilia', 'Deep vein thrombosis', 'Pulmonary embolism'],
  },
  {
    name: 'F2',
    fullName: 'Coagulation Factor II (Prothrombin)',
    associatedConditions: ['Prothrombin G20210A mutation', 'Thrombophilia'],
  },
];
