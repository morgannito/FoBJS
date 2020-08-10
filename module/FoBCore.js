
const { app, dialog} = require("electron");
const FoBMain = require("../main");

exports.debug = debug;
exports.error = error;
exports.pWL = printWelcomeMessage;
exports.printAutoLogInMessage = printAutoLogInMessage;
exports.promptUpdate = promptUpdate;
exports.getRandomInt = getRandomInt;
exports.getRandomIntervall = getRandomIntervall;
exports.getNextRequestID = getNextRequestID;
exports.hasOnlySupplyProduction = hasOnlySupplyProduction;
exports.GetP1 = GetP1;
exports.GetDistinctCount = GetDistinctCount;
exports.getGoodsProductionOptions = getGoodsProductionOptions;
exports.getProductionOptions = getProductionOptions;
exports.GetGoodsEraSorted = GetGoodsEraSorted;

var reqID = 2;

function getRandomInt(max, min = null) {
    if (min === null)
        return Math.floor(Math.random() * Math.floor(max));
    else
        return Math.floor(Math.random() * (max - min) + min);
}
function getNextRequestID() {
    let AddID = Math.floor(Math.random() * (10 - 1) + 1);
    reqID += AddID
    return reqID;
}
function getRandomIntervall() {
    return Math.floor(Math.random() * (2000 - 800) + 800);
}
function getProductionOptions() {
    return {
        5: { text: "5min", id: 1 },
        15: { text: "15min", id: 2 },
        60: { text: "1h", id: 3 },
        240: { text: "4h", id: 4 },
        480: { text: "8h", id: 5 },
        1440: { text: "1d", id: 6 }
    }
}
function getGoodsProductionOptions() {
    return {
        240: { text: "4h", id: 1 },
        480: { text: "8h", id: 2 },
        1440: { text: "1d", id: 3 },
        2880: { text: "2d", id: 4 }
    }
}
function hasOnlySupplyProduction(availableProducts) {
    var checkBool = [false, false, false, false, false, false];
    for (let x = 0; x < availableProducts.length; x++) {
        const product = availableProducts[x];
        if (undefined !== product["product"])
            if (undefined !== product["product"]["resources"])
                if (undefined !== product["product"]["resources"]["supplies"])
                    checkBool[x] = true;
    }
    return checkBool.every((v) => v === true);
}
function printWelcomeMessage(Gwin, xapp, printLogin = true) {
    Gwin.webContents.send('print', "#########################################################################");
    Gwin.webContents.send('print', "#########################################################################");
    Gwin.webContents.send('print', "#########################################################################");
    Gwin.webContents.send('print', `${' '.repeat(73-(FoBMain.i18n("Login.WelcomeMessage").replace("__Version__",app.getVersion()).length))}${FoBMain.i18n("Login.WelcomeMessage").replace("__Version__",app.getVersion())}`);
    Gwin.webContents.send('print', "#########################################################################");
    Gwin.webContents.send('print', "#########################################################################");
    Gwin.webContents.send('print', "#########################################################################");
    Gwin.webContents.send('print', " ");
    Gwin.webContents.send('print', " ");
    if (printLogin)
        Gwin.webContents.send('print', FoBMain.i18n("Login.CanLoginNow"));
    Gwin.webContents.send('print', " ");
}

function printAutoLogInMessage(Gwin){
    Gwin.webContents.send('print', "Logging in...");
}

function GetP1(AgeString, Level) {
    let BronzeAge = [5, 10, 10, 15, 25, 30, 35, 40, 45, 55, 60, 65, 75, 80, 85, 95, 100, 110, 115, 125, 130, 140, 145, 155, 160, 170, 180, 185, 195, 200, 210, 220, 225, 235, 245, 250, 260, 270, 275, 285, 295, 300, 310, 320, 330, 340, 345, 355, 365, 375, 380, 390, 400, 410, 420, 430, 440, 445, 455, 465, 475, 485, 495, 505, 510, 520, 530, 540, 550, 560, 570, 580, 590, 600, 610, 620, 630, 640, 650, 660, 670, 680, 690, 700, 710, 720, 730, 740, 750, 760, 770, 780, 790, 800, 810, 820, 830, 840, 850, 860, 870, 880, 890, 905, 915, 925, 935, 945, 955, 965, 975, 985, 995, 1010, 1020, 1030, 1040, 1050, 1060, 1070, 1085, 1095, 1105, 1115, 1125, 1135, 1150, 1160, 1170, 1180, 1190, 1200, 1215, 1225, 1235, 1245, 1255, 1270, 1280, 1290, 1300, 1310, 1325, 1335, 1345, 1355, 1370, 1380, 1390, 1400, 1415, 1425, 1435, 1445, 1460, 1470, 1480];

    let IronAge = [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 65, 70, 80, 85, 95, 105, 110, 120, 125, 135, 145, 150, 160, 170, 175, 185, 195, 200, 210, 220, 230, 240, 245, 255, 265, 275, 285, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 405, 415, 425, 435, 450, 455, 465, 475, 485, 495, 510, 520, 530, 540, 550, 560, 570, 580, 590, 600, 610, 620, 630, 645, 655, 665, 675, 685, 695, 705, 720, 730, 740, 750, 760, 775, 785, 795, 805, 815, 825, 840, 850, 860, 870, 885, 895, 905, 915, 930, 940, 950, 960, 975, 985, 995, 1010, 1020, 1030, 1040, 1055, 1065];

    let EarlyMiddleAge = [5, 10, 15, 20, 25, 35, 40, 50, 55, 65, 70, 80, 85, 95, 100, 110, 120, 130, 135, 145, 155, 165, 175, 180, 190, 200, 210, 220, 230, 240, 250, 255, 265, 275, 285, 295, 305, 315, 325, 335, 345, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 465, 475, 485, 495, 505, 515, 525, 540, 550, 560, 570, 585, 595, 605, 615, 625, 640, 650, 660, 675, 685, 695, 705, 720, 730, 740, 755, 765, 775, 790, 800, 810, 825, 835, 850, 860, 875, 885, 895, 910, 920, 930, 945, 955, 970, 980, 995, 1005, 1015, 1030, 1040, 1055, 1065, 1080, 1090, 1105, 1115, 1130, 1140, 1155, 1165, 1180, 1190, 1205, 1215, 1230, 1240, 1255, 1265, 1280, 1290, 1305, 1320, 1330, 1345, 1355, 1370, 1380, 1395, 1405, 1420, 1435];

    let HighMiddleAge = [5, 10, 15, 20, 30, 35, 45, 50, 60, 65, 75, 85, 95, 100, 110, 120, 130, 140, 150, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 300, 310, 320, 330, 340, 350, 365, 375, 385, 395, 405, 420, 430, 440, 450, 465, 475, 485, 500, 510, 520, 535, 545, 555, 570, 580, 590, 605, 615, 630, 640, 650, 665, 675, 690, 700, 715, 725, 735, 750, 760, 775, 785, 800, 810, 825, 835, 850, 860, 875, 890, 900, 915, 925, 940, 950, 965, 975, 990, 1005, 1015, 1030, 1040, 1055, 1070, 1080, 1095, 1110, 1120, 1135, 1150, 1160, 1175, 1190, 1200, 1215, 1230, 1240, 1255];

    let LateMiddleAge = [5, 10, 15, 25, 30, 40, 45, 55, 65, 70, 80, 90, 100, 110, 120, 125, 140, 150, 155, 170, 180, 190, 200, 210, 220, 230, 240, 250, 265, 275, 285, 295, 310, 320, 330, 340, 355, 365, 375, 390, 400, 410, 425, 435, 450, 460, 470, 485, 495, 510, 520, 535, 545, 560, 570, 585, 595, 610, 620, 635, 645, 660, 670, 685, 700, 710, 725, 735, 750, 765, 775, 790, 805, 815, 830, 845, 855, 870, 885, 895, 910, 925, 935, 950, 965, 980, 990, 1005, 1020, 1035, 1045, 1060, 1075, 1090, 1105, 1115, 1130, 1145, 1160, 1175, 1185, 1200, 1215, 1230, 1245, 1260, 1275, 1285, 1300, 1315, 1330, 1345, 1360, 1375, 1390, 1405, 1415, 1430, 1445, 1460, 1475, 1490, 1505, 1520, 1535, 1550, 1565, 1580, 1595, 1610, 1625, 1640, 1655, 1670, 1685, 1700, 1715, 1730, 1745, 1760, 1775, 1790];

    let ColonialAge = [5, 10, 15, 25, 35, 40, 50, 60, 65, 75, 85, 95, 105, 115, 125, 135, 145, 155, 170, 180, 190, 200, 210, 225, 235, 245, 260, 270, 280, 295, 305, 315, 330, 340, 350, 365, 375, 390, 400, 415, 425, 440, 450, 465, 480, 490, 505, 515, 530, 540, 555, 570, 580, 595, 610, 620, 635, 650, 665, 675, 690, 705, 715, 730, 745, 760, 775, 785, 800, 815, 830, 840, 855, 870, 885, 900, 915, 930, 940, 955, 970, 985, 1000, 1015, 1030, 1045, 1060, 1075, 1090, 1100, 1115, 1130, 1145, 1160, 1175, 1190, 1205, 1220, 1235, 1250, 1265, 1280, 1295, 1310, 1325];

    let IndustrialAge = [10, 10, 20, 25, 35, 45, 50, 60, 70, 80, 90, 100, 115, 120, 135, 145, 155, 165, 180, 190, 200, 215, 225, 235, 250, 260, 275, 285, 300, 310, 325, 335, 350, 360, 375, 390, 400, 415, 425, 440, 455, 465, 480, 495, 505, 520, 535, 550, 560, 575, 590, 605, 620, 635, 645, 660, 675, 690, 705, 720, 735, 745, 760, 775, 790, 805, 820, 835, 850, 865, 880, 895, 910, 925, 940, 955, 970, 985, 1000, 1015, 1030, 1045, 1065, 1075, 1095, 1110, 1125, 1140, 1155, 1170, 1185, 1200, 1220, 1235, 1250, 1265, 1280, 1300, 1315, 1330, 1345, 1360, 1375, 1395, 1410, 1425];

    let ProgressiveEra = [10, 10, 20, 30, 35, 45, 55, 65, 75, 85, 95, 105, 120, 130, 140, 155, 165, 175, 190, 200, 215, 225, 240, 250, 265, 275, 290, 300, 315, 330, 340, 355, 370, 385, 395, 410, 425, 440, 450, 465, 480, 495, 510, 525, 535, 550, 565, 580, 595, 610, 625, 640, 655, 670, 685, 700, 715, 730, 745, 760, 775, 790, 805, 820, 835, 855, 870, 885, 900, 915, 930, 945, 965, 980, 995, 1010, 1025, 1045, 1060, 1075, 1090, 1110, 1125, 1140, 1160, 1175, 1190, 1205, 1225, 1240, 1255, 1275, 1290, 1305, 1325, 1340, 1355, 1375, 1390, 1410, 1425, 1440, 1460, 1475, 1490, 1510, 1525, 1545, 1560, 1580, 1595, 1615, 1630, 1650, 1665, 1685, 1700, 1715, 1735, 1755, 1770, 1790, 1805, 1825, 1840, 1860, 1875, 1895, 1915, 1930, 1950, 1965, 1985, 2000, 2020, 2040, 2055, 2075, 2095, 2110, 2130, 2145, 2165, 2185, 2200, 2220, 2240, 2255, 2275, 2295, 2310, 2330, 2350, 2365, 2385, 2405, 2420, 2440, 2460, 2480, 2495, 2515, 2535, 2555, 2570, 2590, 2610, 2630, 2645, 2665, 2685, 2705, 2720];

    let ModernEra = [10, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 115, 125, 135, 150, 160, 175, 185, 200, 210, 225, 240, 250, 265, 280, 290, 305, 320, 335, 345, 360, 375, 390, 405, 420, 430, 450, 460, 475, 490, 505, 520, 535, 550, 565, 580, 600, 615, 630, 645, 660, 675, 690, 705, 725, 740, 755, 770, 785, 800, 820, 835, 850, 870, 885, 900, 915, 935, 950, 965, 985, 1000, 1015, 1035, 1050, 1065, 1085, 1100, 1120, 1135, 1150, 1170, 1185, 1205, 1220, 1240, 1255, 1275, 1290, 1310, 1325, 1345, 1360, 1380, 1395, 1415, 1430, 1450, 1470, 1485, 1505];

    let PostModernEra = [10, 10, 20, 30, 40, 50, 60, 75, 85, 95, 110, 120, 130, 145, 155, 170, 185, 195, 210, 225, 235, 250, 265, 280, 295, 305, 320, 335, 350, 365, 380, 395, 410, 425, 440, 455, 470, 485, 500, 515, 535, 550, 565, 580, 595, 615, 630, 645, 660, 675, 695, 710, 725, 745, 760, 775, 795, 810, 830, 845, 860, 880, 895, 915, 930, 945, 965, 985, 1000, 1020, 1035, 1050, 1070, 1090, 1105, 1125, 1140, 1160, 1175, 1195, 1215, 1230, 1250, 1265, 1285, 1305, 1320, 1340, 1360, 1375, 1395, 1415, 1435, 1450, 1470, 1490, 1510, 1525, 1545, 1565, 1585, 1600, 1620, 1640, 1660, 1680, 1695, 1715, 1735, 1755, 1775, 1790, 1810, 1830, 1850, 1870, 1890, 1910, 1930, 1950, 1965, 1985, 2005, 2025, 2045, 2065, 2085, 2105, 2125, 2145, 2165, 2185, 2205, 2225, 2245, 2265];

    let ContemporaryEra = [10, 15, 20, 30, 40, 55, 65, 75, 85, 100, 115, 125, 140, 150, 165, 180, 190, 205, 220, 235, 250, 265, 280, 290, 305, 320, 335, 355, 365, 385, 400, 415, 430, 445, 460, 480, 495, 510, 525, 545, 560, 575, 590, 610, 625, 645, 660, 675, 695, 710, 730, 745, 765, 780, 800, 815, 835, 850, 870, 885, 905, 920, 940, 960, 975, 995, 1015, 1030, 1050, 1070, 1085, 1105, 1125, 1140, 1160, 1180, 1200, 1215, 1235, 1255, 1275, 1290, 1310, 1330, 1350, 1370, 1390, 1410, 1425, 1445, 1465, 1485, 1505, 1525, 1545, 1565, 1580, 1600, 1625, 1640, 1660, 1680, 1700, 1720, 1740, 1760, 1780, 1800, 1820, 1840, 1860, 1880, 1900, 1920, 1945, 1965, 1985, 2005, 2025, 2045, 2065, 2085, 2105, 2125];

    let TomorrowEra = [10, 15, 20, 35, 45, 55, 65, 80, 90, 105, 120, 130, 145, 160, 175, 185, 200, 215, 230, 245, 260, 275, 290, 305, 320, 335, 355, 370, 385, 400, 420, 435, 450, 465, 485, 500, 515, 535, 550, 570, 585, 605, 620, 640, 655, 675, 690, 710, 730, 745, 765, 780, 800, 820, 835, 855, 875, 890, 910, 930, 945, 965, 985, 1005, 1025, 1040, 1060, 1080, 1100, 1120, 1140, 1155, 1175, 1195, 1215, 1235, 1255, 1275, 1295, 1315, 1335, 1355, 1375, 1395, 1415, 1435, 1455, 1475, 1495, 1515, 1535, 1555, 1575, 1595, 1615, 1640, 1660, 1680, 1700, 1720, 1740, 1760, 1780, 1805];

    let FutureEra = [10, 15, 25, 35, 45, 60, 70, 85, 95, 110, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 290, 305, 320, 335, 355, 370, 385, 405, 420, 435, 455, 470, 490, 505, 525, 540, 560, 575, 595, 615, 630, 650, 670, 685, 705, 725, 740, 760, 780, 800, 815, 835, 855, 875, 895, 915, 930, 950, 970, 990, 1010, 1030, 1050, 1070, 1090, 1110, 1130, 1150, 1170, 1190, 1210, 1230, 1250, 1270, 1290, 1310, 1335, 1355, 1375, 1395, 1415, 1435, 1455, 1480, 1500, 1520, 1540, 1560, 1585, 1605, 1625, 1645, 1670, 1690, 1710, 1735, 1755, 1775, 1800, 1820, 1840, 1865, 1885, 1905, 1930, 1950, 1975, 1995, 2015, 2040, 2060, 2085, 2105, 2130, 2150, 2170, 2195, 2215, 2240, 2260, 2285, 2305, 2330, 2350, 2375, 2395, 2420, 2445, 2465, 2490, 2510, 2535, 2555, 2580, 2605, 2625, 2650, 2675, 2695, 2720, 2740, 2765, 2790, 2810, 2835, 2860, 2880, 2905, 2930, 2950, 2975, 3000, 3025, 3050, 3070, 3095, 3120, 3140, 3165, 3190, 3215, 3235, 3260, 3285, 3310, 3335, 3355, 3380, 3405, 3430, 3455, 3480, 3500, 3525, 3550, 3575, 3600, 3625, 3650, 3670, 3695, 3720];

    let ArcticFuture = [10, 15, 25, 35, 45, 60, 75, 85, 100, 115, 130, 145, 160, 170, 190, 205, 220, 235, 250, 265, 285, 300, 315, 335, 350, 370, 385, 400, 420, 440, 455, 475, 490, 510, 525, 545, 565, 585, 600, 620, 640, 660, 675, 695, 715, 735, 755, 775, 795, 815, 830, 850, 870, 895, 910, 930, 950, 970, 995, 1015, 1035, 1055, 1075, 1095, 1115, 1135, 1155, 1180, 1200, 1220, 1240, 1260, 1285, 1305, 1325, 1350, 1370, 1390, 1410, 1435, 1455, 1475, 1500, 1520, 1545, 1565, 1585, 1610, 1630, 1650, 1675, 1695, 1720, 1740, 1765, 1785, 1810, 1830, 1855, 1875, 1900, 1920, 1945, 1965, 1990, 2015, 2035, 2060, 2080, 2105, 2125, 2150, 2175, 2195, 2220, 2245, 2265, 2290, 2315, 2335, 2360, 2385, 2405, 2430, 2455, 2480, 2500, 2525, 2550, 2575, 2595, 2620, 2645, 2670, 2690, 2715, 2740];

    let OceanicFuture = [10, 15, 25, 35, 50, 65, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 230, 245, 260, 280, 295, 310, 330, 350, 365, 385, 400, 420, 440, 455, 475, 495, 510, 530, 550, 570, 590, 605, 625, 645, 665, 685, 705, 725, 745, 765, 785, 805, 825, 845, 865, 890, 910, 930, 950, 970, 990, 1015, 1035, 1055, 1075, 1100, 1120, 1140, 1160, 1185, 1205, 1225, 1250, 1270, 1295, 1315, 1335, 1360, 1380, 1405, 1425, 1450, 1470, 1495, 1515, 1540, 1560, 1585, 1605, 1630, 1650, 1675, 1700, 1720, 1745, 1770, 1790, 1815, 1835, 1860, 1885, 1905, 1930, 1955, 1980, 2000, 2025, 2050, 2070, 2095, 2120, 2145, 2170, 2190, 2215, 2240, 2265, 2290, 2310];

    let VirtualFuture = [10, 15, 25, 40, 50, 65, 80, 95, 110, 125, 140, 155, 170, 185, 205, 220, 235, 255, 270, 290, 305, 325, 345, 360, 380, 400, 415, 435, 455, 475, 495, 510, 530, 550, 570, 590, 610, 630, 650, 670, 690, 715, 735, 755, 775, 795, 815, 840, 860, 880, 900, 925, 945, 965, 990, 1010, 1030, 1055, 1075, 1095, 1120, 1140, 1165, 1185, 1210, 1230, 1255, 1275, 1300, 1320, 1345, 1365, 1390, 1415, 1435, 1460, 1485, 1505, 1530, 1555, 1575, 1600, 1625, 1645, 1670, 1695, 1720, 1745, 1765, 1790, 1815, 1840, 1860, 1885, 1910, 1935, 1960, 1985, 2010, 2030, 2055, 2080, 2105, 2130, 2155, 2180, 2205, 2230, 2255, 2280, 2305, 2330, 2355, 2380, 2405, 2430, 2455, 2480, 2505, 2530];

    let SpaceAgeMars = [10, 15, 25, 40, 55, 70, 80, 95, 115, 125, 145, 160, 175, 195, 210, 230, 245, 265, 280, 300, 320, 335, 355, 375, 395, 415, 435, 455, 470, 490, 510, 535, 550, 575, 595, 615, 635, 655, 675, 700, 720, 740, 760, 785, 805, 825, 850, 870, 890, 915, 935, 960, 980, 1005, 1025, 1050, 1070, 1095, 1115, 1140, 1160, 1185, 1210, 1230, 1255, 1280, 1300, 1325, 1350, 1370, 1395, 1420, 1445, 1470, 1490, 1515, 1540, 1565, 1590, 1615, 1635, 1660, 1685, 1710, 1735, 1760, 1785, 1810, 1835, 1860, 1885, 1910, 1935, 1960, 1985, 2010, 2035, 2060, 2085, 2110, 2135, 2160];

    let AllAge = [5, 10, 15, 20, 30, 35, 45, 50, 60, 65, 75, 85, 95, 100, 110, 120, 130, 140, 150, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 300, 310, 320, 330, 340, 350, 365, 375, 385, 395, 405, 420, 430, 440, 450, 465, 475, 485, 500, 510, 520, 535, 545, 555, 570, 580, 590, 605, 615, 630, 640, 650, 665, 675, 690, 700, 715, 725, 735, 750, 760, 775, 785, 800, 810, 825, 835, 850, 860, 875, 890, 900, 915, 925, 940, 950, 965, 975, 990, 1005, 1015, 1030, 1040, 1055, 1070, 1080, 1095, 1110, 1120, 1135, 1150, 1160, 1175, 1190, 1200, 1215, 1230, 1240, 1255];

    if (AgeString === 'BronzeAge') {
        if (BronzeAge.length < Level) return 0; else return BronzeAge[Level];
    }
    else if (AgeString === 'IronAge') {
        if (IronAge.length < Level) return 0; else return IronAge[Level];
    }
    else if (AgeString === 'EarlyMiddleAge') {
        if (EarlyMiddleAge.length < Level) return 0; else return EarlyMiddleAge[Level];
    }
    else if (AgeString === 'HighMiddleAge') {
        if (HighMiddleAge.length < Level) return 0; else return HighMiddleAge[Level];
    }
    else if (AgeString === 'LateMiddleAge') {
        if (LateMiddleAge.length < Level) return 0; else return LateMiddleAge[Level];
    }
    else if (AgeString === 'ColonialAge') {
        if (ColonialAge.length < Level) return 0; else return ColonialAge[Level];
    }
    else if (AgeString === 'IndustrialAge') {
        if (IndustrialAge.length < Level) return 0; else return IndustrialAge[Level];
    }
    else if (AgeString === 'ProgressiveEra') {
        if (ProgressiveEra.length < Level) return 0; else return ProgressiveEra[Level];
    }
    else if (AgeString === 'ModernEra') {
        if (ModernEra.length < Level) return 0; else return ModernEra[Level];
    }
    else if (AgeString === 'PostModernEra') {
        if (PostModernEra.length < Level) return 0; else return PostModernEra[Level];
    }
    else if (AgeString === 'ContemporaryEra') {
        if (ContemporaryEra.length < Level) return 0; else return ContemporaryEra[Level];
    }
    else if (AgeString === 'TomorrowEra') {
        if (TomorrowEra.length < Level) return 0; else return TomorrowEra[Level];
    }
    else if (AgeString === 'FutureEra') {
        if (FutureEra.length < Level) return 0; else return FutureEra[Level];
    }
    else if (AgeString === 'ArcticFuture') {
        if (ArcticFuture.length < Level) return 0; else return ArcticFuture[Level];
    }
    else if (AgeString === 'OceanicFuture') {
        if (BronzeAge.length < Level) return 0; else return OceanicFuture[Level];
    }
    else if (AgeString === 'VirtualFuture') {
        if (VirtualFuture.length < Level) return 0; else return VirtualFuture[Level];
    }
    else if (AgeString === 'SpaceAgeMars') {
        if (SpaceAgeMars.length < Level) return 0; else return SpaceAgeMars[Level];
    }
    else if (AgeString === 'AllAge') {
        if (AllAge.length < Level) return 0; else return AllAge[Level];
    }
    else {
        return 0;
    }
}
function GetDistinctCount(arr) {
    var counter = [];
    var increment = false;
    for (var x = 0; x < arr.length; x++) {
        if (counter.length == 0) {
            counter.push({
                count: 1,
                ...arr[x]
            });
        } else {
            for (var c = 0; c < counter.length; c++) {
                if (counter[c]._id === arr[x]._id) {
                    increment = c;
                    break;
                } else {
                    increment = false;
                }
            }
            if (increment !== false) {
                counter[increment].count += 1;
            } else {
                counter.push({
                    count: 1,
                    ...arr[x]
                })
            }
        }
    }
    return counter;
}
function GetGoodsEraSorted(eraDict, Resources, ResourceDefinition) {
    var Goods = {};
    var isEraGood = toAdd = true;
    for (let e = 0; e < eraDict.length; e++) {
        const era = eraDict[e];
        for (let rd = 0; rd < ResourceDefinition.length; rd++) {
            const resD = ResourceDefinition[rd];
            if (Goods[era["era"]] !== undefined && Goods[era["era"]]["Goods"].length >= 5) break;
            if (resD["era"] === era["era"]) {
                isEraGood = true;
                toAdd = true;
                for (const res in Resources) {
                    if (Resources.hasOwnProperty(res)) {
                        const _amount = Resources[res];
                        if (resD["id"] === res) {
                            if (Goods[era["era"]] !== undefined) {
                                Goods[era["era"]]["Name"] = era["name"];
                                if (Goods[era["era"]]["Goods"] !== undefined) {
                                    Goods[era["era"]]["Goods"].push({ id: resD["id"], name: resD["name"], amount: _amount });
                                    toAdd = false;
                                    break;
                                } else {
                                    Goods[era["era"]]["Name"] = era["name"];
                                    Goods[era["era"]]["Goods"] = [];
                                    Goods[era["era"]]["Goods"].push({ id: resD["id"], name: resD["name"], amount: _amount });
                                    toAdd = false;
                                    break;
                                }
                            }
                            else {
                                Goods[era["era"]] = {};
                                Goods[era["era"]]["Name"] = era["name"];
                                if (Goods[era["era"]]["Goods"] !== undefined) {
                                    Goods[era["era"]]["Goods"].push({ id: resD["id"], name: resD["name"], amount: _amount });
                                    toAdd = false;
                                    break;
                                } else {
                                    Goods[era["era"]]["Goods"] = [];
                                    Goods[era["era"]]["Goods"].push({ id: resD["id"], name: resD["name"], amount: _amount });
                                    toAdd = false;
                                    break;
                                }
                            }
                        }
                    }
                }
                /* if (isEraGood && toAdd) {
                    if (Goods[era["era"]] === undefined) {
                        Goods[era["era"]] = {};
                        Goods[era["era"]]["Name"] = era["name"];
                    }
                    if (Goods[era["era"]]["Goods"] !== undefined) {
                        Goods[era["era"]]["Goods"].push({ id: resD["id"], name: resD["name"], amount: 0 });
                        toAdd, isEraGood = false;
                    } else {
                        Goods[era["era"]]["Goods"] = [];
                        Goods[era["era"]]["Goods"].push({ id: resD["id"], name: resD["name"], amount: 0 });
                        toAdd, isEraGood = false;
                    }
                } */
            }
        }
    }

    return Goods;
}
async function promptUpdate(newVersion) {
    return dialog.showMessageBox(null, {
        type: 'warning',
        buttons: [FoBMain.i18n("Update.ButtonOk"), FoBMain.i18n("Update.ButtonQuit")],
        defaultId: 0,
        title: FoBMain.i18n("Update.Title"),
        message: FoBMain.i18n("Update.Message"),
        detail: FoBMain.i18n("Update.DetailMessage").replace("###curVer###", app.getVersion()).replace("###newVer###", newVersion)
    });
    /* dialog.showMessageBoxSync(null, {
        type: 'warning',
        buttons: [FoBMain.i18n("Update.ButtonOk"), FoBMain.i18n("Update.ButtonQuit")],
        defaultId: 0,
        title: FoBMain.i18n("Update.Title"),
        message: FoBMain.i18n("Update.Message"),
        detail: FoBMain.i18n("Update.DetailMessage").replace("###curVer###", app.getVersion()).replace("###newVer###", newVersion)
    }, (response) => {
        debug(response);
        if (response == 0)
            shell.openExternal("https://github.com/Th3C0D3R/FoBJS_Release/releases");
    }) */
}
var options = {month :'long',day : 'numeric'};
const fs = require('fs');
var stream = fs.createWriteStream(`DebugLog.txt`, {flags:'w'});
function debug(msg) {
    stream.write(`${new Date().toLocaleString()} \n ${msg} \n ${getStackTrace()}` + "\n\n");
    console.log(`[DEBUG] ${new Date().toLocaleString()} ${msg}`);
}

var getStackTrace = function() {
    var obj = {};
    Error.captureStackTrace(obj, getStackTrace);
    return obj.stack;
  };
function error(msg) {
    console.log(`[ERROR] ${new Date().toLocaleString()} ${msg}`);
}
exports.Servers = Servers = {
    "en": "en.forgeofempires.com",
    "de": "de.forgeofempires.com",
    "beta": "beta.forgeofempires.com",
    "us": "us.forgeofempires.com",
    "fr": "fr.forgeofempires.com",
    "nl": "nl.forgeofempires.com",
    "pl": "pl.forgeofempires.com",
    "gr": "gr.forgeofempires.com",
    "it": "it.forgeofempires.com",
    "es": "es.forgeofempires.com",
    "pt": "pt.forgeofempires.com",
    "ru": "ru.forgeofempires.com",
    "ro": "ro.forgeofempires.com",
    "br": "br.forgeofempires.com",
    "cz": "cz.forgeofempires.com",
    "hu": "hu.forgeofempires.com",
    "se": "se.forgeofempires.com",
    "sk": "sk.forgeofempires.com",
    "tr": "tr.forgeofempires.com",
    "dk": "dk.forgeofempires.com",
    "no": "no.forgeofempires.com",
    "th": "th.forgeofempires.com",
    "ar": "ar.forgeofempires.com",
    "mx": "mx.forgeofempires.com",
    "fi": "fi.forgeofempires.com"
}