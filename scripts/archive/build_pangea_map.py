import json

# Full mapping of all 35 Pangea courses
PANGEA_FULL_MAP = {
    # Mathematics
    '104041': 'https://idofangbentov.uk/Technion/CAL1/',
    '01040041': 'https://idofangbentov.uk/Technion/CAL1/',
    '104043': 'https://idofangbentov.uk/Technion/CAL2/',
    '01040043': 'https://idofangbentov.uk/Technion/CAL2/',
    '104016': 'https://idofangbentov.uk/Technion/ALG1/',
    '01040016': 'https://idofangbentov.uk/Technion/ALG1/',
    '104065': 'https://idofangbentov.uk/Technion/ALG1/',
    '01040065': 'https://idofangbentov.uk/Technion/ALG1/',
    '104131': 'https://idofangbentov.uk/Technion/DEQ1/',
    '01040131': 'https://idofangbentov.uk/Technion/DEQ1/',
    '104228': 'https://idofangbentov.uk/Technion/PDE1/',
    '01040228': 'https://idofangbentov.uk/Technion/PDE1/',
    
    # Physics & Chemistry
    '114051': 'https://idofangbentov.uk/Technion/PHY1/',
    '01140051': 'https://idofangbentov.uk/Technion/PHY1/',
    '114071': 'https://idofangbentov.uk/Technion/PHY1/',
    '01140071': 'https://idofangbentov.uk/Technion/PHY1/',
    '114052': 'https://idofangbentov.uk/Technion/PHY2/',
    '01140052': 'https://idofangbentov.uk/Technion/PHY2/',
    '114075': 'https://idofangbentov.uk/Technion/PHY2/',
    '01140075': 'https://idofangbentov.uk/Technion/PHY2/',
    '114032': 'https://idofangbentov.uk/Technion/LPH1/',
    '01140032': 'https://idofangbentov.uk/Technion/LPH1/',
    '114054': 'https://idofangbentov.uk/Technion/PHY3/',
    '01140054': 'https://idofangbentov.uk/Technion/PHY3/',
    '125001': 'https://idofangbentov.uk/Technion/GCH1/',
    '01250001': 'https://idofangbentov.uk/Technion/GCH1/',
    
    # Computer Science & Materials
    '234128': 'https://idofangbentov.uk/Technion/IPY1/',
    '02340128': 'https://idofangbentov.uk/Technion/IPY1/',
    '314533': 'https://idofangbentov.uk/Technion/IMT1/',
    '0314533': 'https://idofangbentov.uk/Technion/IMT1/',
    
    # Core Mechanical Engineering
    '034010': 'https://idofangbentov.uk/Technion/DYN1/',
    '00340010': 'https://idofangbentov.uk/Technion/DYN1/',
    '34010': 'https://idofangbentov.uk/Technion/DYN1/',
    '034015': 'https://idofangbentov.uk/Technion/DYN1/',
    '34015': 'https://idofangbentov.uk/Technion/DYN1/',
    
    '034013': 'https://idofangbentov.uk/Technion/SLD1/',
    '34013': 'https://idofangbentov.uk/Technion/SLD1/',
    '034028': 'https://idofangbentov.uk/Technion/SLD1/',
    '00340028': 'https://idofangbentov.uk/Technion/SLD1/',
    '34028': 'https://idofangbentov.uk/Technion/SLD1/',
    
    '034030': 'https://idofangbentov.uk/Technion/MNF1/',
    '00340030': 'https://idofangbentov.uk/Technion/MNF1/',
    '34030': 'https://idofangbentov.uk/Technion/MNF1/',
    
    '034032': 'https://idofangbentov.uk/Technion/LSY1/',
    '00340032': 'https://idofangbentov.uk/Technion/LSY1/',
    '34032': 'https://idofangbentov.uk/Technion/LSY1/',
    
    '034035': 'https://idofangbentov.uk/Technion/THE1/',
    '00340035': 'https://idofangbentov.uk/Technion/THE1/',
    '34035': 'https://idofangbentov.uk/Technion/THE1/',
    
    '034053': 'https://idofangbentov.uk/Technion/SLD2/',
    '00340053': 'https://idofangbentov.uk/Technion/SLD2/',
    '34053': 'https://idofangbentov.uk/Technion/SLD2/',
    
    '034055': 'https://idofangbentov.uk/Technion/FLD1/',
    '00340055': 'https://idofangbentov.uk/Technion/FLD1/',
    '34055': 'https://idofangbentov.uk/Technion/FLD1/',
    '034033': 'https://idofangbentov.uk/Technion/FLD1/',
    '34033': 'https://idofangbentov.uk/Technion/FLD1/',
    
    '034056': 'https://idofangbentov.uk/Technion/NUM1/',
    '00340056': 'https://idofangbentov.uk/Technion/NUM1/',
    '34056': 'https://idofangbentov.uk/Technion/NUM1/',
    
    '00340051': 'https://idofangbentov.uk/Technion/DVI1/',
    '034051': 'https://idofangbentov.uk/Technion/DVI1/',
    '34051': 'https://idofangbentov.uk/Technion/DVI1/',
    
    '00340041': 'https://idofangbentov.uk/Technion/HTF1/',
    '034041': 'https://idofangbentov.uk/Technion/HTF1/',
    '34041': 'https://idofangbentov.uk/Technion/HTF1/',
    
    '00340040': 'https://idofangbentov.uk/Technion/ICT1/',
    '034040': 'https://idofangbentov.uk/Technion/ICT1/',
    '34040': 'https://idofangbentov.uk/Technion/ICT1/',
    
    '00340022': 'https://idofangbentov.uk/Technion/IME1/',
    '034022': 'https://idofangbentov.uk/Technion/IME1/',
    '34022': 'https://idofangbentov.uk/Technion/IME1/',
    
    '00340054': 'https://idofangbentov.uk/Technion/MDN1/',
    '034054': 'https://idofangbentov.uk/Technion/MDN1/',
    '34054': 'https://idofangbentov.uk/Technion/MDN1/',
    
    '00340034': 'https://idofangbentov.uk/Technion/ELM1/',
    '034034': 'https://idofangbentov.uk/Technion/ELM1/',
    '34034': 'https://idofangbentov.uk/Technion/ELM1/',
    
    '00340058': 'https://idofangbentov.uk/Technion/PSM1/',
    '034058': 'https://idofangbentov.uk/Technion/PSM1/',
    '34058': 'https://idofangbentov.uk/Technion/PSM1/',
    
    '00340057': 'https://idofangbentov.uk/Technion/LMA1/',
    '034057': 'https://idofangbentov.uk/Technion/LMA1/',
    '34057': 'https://idofangbentov.uk/Technion/LMA1/',
    
    '00340371': 'https://idofangbentov.uk/Technion/PDM1/',
    '034371': 'https://idofangbentov.uk/Technion/PDM1/',
    '34371': 'https://idofangbentov.uk/Technion/PDM1/',
    
    # Advanced & Electives
    '00350022': 'https://idofangbentov.uk/Technion/FEM1/',
    '035022': 'https://idofangbentov.uk/Technion/FEM1/',
    '35022': 'https://idofangbentov.uk/Technion/FEM1/',
    
    '00350001': 'https://idofangbentov.uk/Technion/IRB1/',
    '035001': 'https://idofangbentov.uk/Technion/IRB1/',
    '35001': 'https://idofangbentov.uk/Technion/IRB1/',
    
    '00350041': 'https://idofangbentov.uk/Technion/MCS1/',
    '035041': 'https://idofangbentov.uk/Technion/MCS1/',
    '35041': 'https://idofangbentov.uk/Technion/MCS1/',
    
    '00380800': 'https://idofangbentov.uk/Technion/MCS2/',
    '038800': 'https://idofangbentov.uk/Technion/MCS2/',
    
    '00360087': 'https://idofangbentov.uk/Technion/HDY1/',
    '036087': 'https://idofangbentov.uk/Technion/HDY1/'
}

print(f"Total mapped code entries: {len(PANGEA_FULL_MAP)}")
unique_urls = set(PANGEA_FULL_MAP.values())
print(f"Total unique Pangea course hubs: {len(unique_urls)}")
