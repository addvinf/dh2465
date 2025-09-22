import xml.etree.ElementTree as ET
import pandas as pd

#metavariabler
FORMAT = "LÖNIN"
VERSION = "2.1"
LAND = "Sverige"
PROGRAMNAMN = "Lönekörning"
EXCEL_FILE = "./lönefiler/input/testfil2.xlsx"
OUTPUT_FILE = "./lönefiler/output/visa_david2.pax"
DATE = "2024-03-12"

#create header
def create_metatag():
    return b'<?xml version="1.0" encoding="utf-8"?>\n'

def create_header():
    header = ET.Element("header")
    format_element = ET.SubElement(header, "format")
    version_element = ET.SubElement(header, "version")
    land_element = ET.SubElement(header, "land")
    programnamn_element = ET.SubElement(header, "programnamn")
    
    format_element.text = FORMAT
    version_element.text = VERSION
    land_element.text = LAND
    programnamn_element.text = PROGRAMNAMN

    return header

#create the folding lonetransaktioner
def create_lon_folder():
    lonetransaktioner = ET.Element("lonetransaktioner")
    return lonetransaktioner

#create one lönetransaktion based on indata
def create_transaction(persnr, lonart, benamning, antal, apris, kommentar, datum):
    lonetrans = ET.Element("lonetrans")
    lonetrans.set('persnr', str(persnr))

    lonart_el = ET.SubElement(lonetrans, "lonart")
    lonart_el.text = lonart

    benamning_el = ET.SubElement(lonetrans, "benamning")
    #denna bör kanske vara automatisk
    benamning_el.text = benamning

    antal_el = ET.SubElement(lonetrans, "antal")
    antal_el.text = str(antal)

    apris_el = ET.SubElement(lonetrans, "apris")
    apris_el.text = str(apris)

    belopp_el = ET.SubElement(lonetrans, "belopp")
    belopp = antal*apris
    belopp_el.text = str(belopp)

    kommentar_el = ET.SubElement(lonetrans, "kommentar")
    kommentar_el.text = kommentar

    datum_el = ET.SubElement(lonetrans, "datum")
    datum_el.text = datum

    return lonetrans

#create around tag
def around_tag():
    paxml = ET.Element("paxml")
    paxml.set("xmlns:xsi", 'http://www.w3.org/2001/XMLSchema-instance')
    paxml.set("xsi:noNamespaceSchemaLocation", 'http://www.paxml.se/2.1/paxml.xsd')
    return paxml

#läs in excel
def read_file():
    dataframe1 = pd.read_excel(EXCEL_FILE)
    print(dataframe1)

    #initiera frame:
    parent = around_tag()
    #header
    header = create_header()
    parent.append(header)

    #där alla trans ligger
    wrapper = ET.Element("lonetransaktioner")
    parent.append(wrapper)

    for index, row in dataframe1.iterrows():
        #tar bort alla som inte ska få lön inrapporterat
        
        if row["Lön"] != 0 and row["Fast lön"] != "JA":
            personnummer = row["Personnummer"]
            lön_träning = row["Tr"]
            lön_match = row["ma"]
            lön_cup = row["Cu/lä"]
            print(f"{personnummer} {lön_träning} {lön_match} {lön_cup}")
            
            #
            totalen = 0
            #Träning
            if row["TrN"] > 0:
                salary = row["TrN"]*lön_träning
                totalen += salary
                #behöver eventuellt läggas till belopp
                lonetrans = create_transaction(personnummer, "112", "Ersättning träning (antal tillfällen)", row["TrN"], row["Tr"], "test", DATE)
                wrapper.append(lonetrans)

            #Match
            if row["MaN"] > 0:
                salary = row["MaN"]*lön_match
                totalen += salary
                lonetrans = create_transaction(personnummer, "113", "Ersättning match (antal tillfällen)", row["MaN"], row["ma"], "test", DATE)
                wrapper.append(lonetrans)

            #Cup/läger
            if row["CupN"] > 0 or row["LägerN"] > 0:
                salary = (row["CupN"] + row["LägerN"])*lön_cup
                totalen +=salary
                total_number = row["CupN"] + row["LägerN"]
                lonetrans = create_transaction(personnummer, "114", "Ersättning cup/läger (antal dagar)", total_number, row["Cu/lä"], "test", DATE)
                wrapper.append(lonetrans)
            
            #ta tillbaka eventuellt, fattar inte riktigt PAX
            """#semesterersättning på allt
            semesterers = round(totalen*0.12, 1)
            #här kanske det behövs en total
            lonetrans = create_transaction(personnummer, "224", "Semesterersättning i anslutning till lön", 1, semesterers, "test", DATE)
            wrapper.append(lonetrans)"""

    #print("kommer ändå hit")
    return parent



#main
def main():
    parent = around_tag()
    lonetrans = create_transaction("1234567890", "Lonart", "Benamning", 5, 10.5, "Kommentar", "2024-03-12")
    parent.append(lonetrans)
    return parent
    


#write to file
with open(OUTPUT_FILE, "wb") as f:
    metatag = create_metatag()
    f.write(metatag)    
    parent = read_file()
    b_parent = ET.tostring(parent)
    f.write(b_parent)