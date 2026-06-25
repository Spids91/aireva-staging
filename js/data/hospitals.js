// ─── HOSPITAL PCR CODES ───────────────────────────────────────────────────────
// To add a hospital: copy an existing entry and fill in the fields.
// ed: use "n/a" if no direct ED line

const HOSPITALS = [
  {county:"Armagh",   name:"Craigavon Area Hospital",                    main:"(048) 38334444",                         ed:"(048) 37561750",                                            pcr:"CAH"},
  {county:"Cavan",    name:"Cavan Monaghan Hospital",                    main:"(049) 4376000",                          ed:"(049) 4376607",                                             pcr:"CGH"},
  {county:"Clare",    name:"Ennis Hospital",                             main:"(065) 6824464",                          ed:"Local Injury Unit (065) 6863121",                           pcr:"ERH"},
  {county:"Cork",     name:"Bantry General Hospital",                    main:"(027) 50133",                            ed:"Local Injury Unit (027) 52929",                             pcr:"BGH"},
  {county:"Cork",     name:"Cork University Hospital",                   main:"(021) 4546400",                          ed:"(021) 4920222",                                             pcr:"CUH"},
  {county:"Cork",     name:"Cork University Maternity Hospital",         main:"(021) 4920500",                          ed:"(021) 4920598",                                             pcr:"CUMH"},
  {county:"Cork",     name:"Mallow General Hospital",                    main:"(022) 21251",                            ed:"(022) 52506",                                               pcr:"MLGH"},
  {county:"Cork",     name:"Mercy University Hospital",                  main:"(021) 4271971",                          ed:"(021) 4935241",                                             pcr:"MUH"},
  {county:"Cork",     name:"South Infirmary Victoria Hospital Cork",     main:"(021) 4926100",                          ed:"n/a",                                                       pcr:"SIVH"},
  {county:"Derry",    name:"Altnagelvin Hospital",                       main:"(048) 71345171",                         ed:"(048) 71611379",                                            pcr:"AHD"},
  {county:"Donegal",  name:"Letterkenny University Hospital",            main:"(074) 9125888",                          ed:"(074) 9123595",                                             pcr:"LGH"},
  {county:"Down",     name:"Daisy Hill Hospital, Newry",                 main:"(048) 30835000",                         ed:"(048) 30832406 / (048) 37562092",                           pcr:"DHH"},
  {county:"Dublin",   name:"AMNCH (Tallaght) – Adult",                  main:"(01) 4142000",                           ed:"(01) 4143536",                                              pcr:"AMNA"},
  {county:"Dublin",   name:"AMNCH (Tallaght) – Paediatric",             main:"(01) 4142000",                           ed:"(01) 4143510",                                              pcr:"AMNC"},
  {county:"Dublin",   name:"Beaumont Hospital",                          main:"(01) 8093000",                           ed:"(01) 8092714",                                              pcr:"BHD"},
  {county:"Dublin",   name:"Connolly Hospital Blanchardstown",           main:"(01) 6465000",                           ed:"(01) 6466250 / (01) 6466251 / (01) 6466191",               pcr:"CHD"},
  {county:"Dublin",   name:"Coombe Women's Hospital",                    main:"(01) 4085200",                           ed:"(01) 4085531",                                              pcr:"CWH"},
  {county:"Dublin",   name:"Mater Misericordiae Hospital",               main:"(01) 8032000",                           ed:"(01) 8032651 / (01) 8032223",                               pcr:"MMH"},
  {county:"Dublin",   name:"National Children's Hospital (Temple St)",   main:"(01) 8784200",                           ed:"(01) 8784829",                                              pcr:"TCH"},
  {county:"Dublin",   name:"National Maternity Hospital, Holles St",     main:"(01) 6373100",                           ed:"n/a",                                                       pcr:"NMH"},
  {county:"Dublin",   name:"Our Lady's Hospital for Sick Children, Crumlin", main:"(01) 4096100",                      ed:"(01) 4096346 / (01) 4096326",                               pcr:"OLHC"},
  {county:"Dublin",   name:"Rotunda Hospital",                           main:"(01) 8171700",                           ed:"n/a",                                                       pcr:"RMH"},
  {county:"Dublin",   name:"Royal Victoria Eye and Ear Hospital",        main:"(01) 6644600",                           ed:"(01) 6343648",                                              pcr:"RVH"},
  {county:"Dublin",   name:"St James's Hospital",                        main:"(01) 4103000",                           ed:"(01) 4162774 / (01) 4162775 / (01) 4162776",               pcr:"SJH"},
  {county:"Dublin",   name:"St Michael's, Dun Laoghaire",               main:"(01) 2806901",                           ed:"(01) 6639815",                                              pcr:"SMH"},
  {county:"Dublin",   name:"St Vincent's University Hospital",           main:"(01) 2214000",                           ed:"(01) 2214358",                                              pcr:"SVH"},
  {county:"Fermanagh",name:"Erne Hospital, Enniskillen",                 main:"(048) 66382000",                         ed:"n/a",                                                       pcr:"EHE"},
  {county:"Galway",   name:"Portiuncula Hospital, Ballinasloe",          main:"(0909) 648200",                          ed:"(0909) 648248",                                             pcr:"PHB"},
  {county:"Galway",   name:"University Hospital Galway",                 main:"(091) 524222",                           ed:"(091) 544556",                                              pcr:"UHG"},
  {county:"Kerry",    name:"University Hospital Kerry",                  main:"(066) 7184000",                          ed:"n/a",                                                       pcr:"KgH"},
  {county:"Kildare",  name:"Naas General Hospital",                      main:"(045) 849500",                           ed:"(045) 849909",                                              pcr:"NGH"},
  {county:"Kilkenny", name:"St Luke's General Hospital",                 main:"(056) 7785000",                          ed:"(056) 7717008",                                             pcr:"SLK"},
  {county:"Laois",    name:"Midland Regional Hospital, Portlaoise",      main:"(057) 8621364",                          ed:"(057) 8696028",                                             pcr:"PMR"},
  {county:"Limerick", name:"University Maternity Hospital Limerick",     main:"(061) 327455",                           ed:"n/a",                                                       pcr:"LRMH"},
  {county:"Limerick", name:"University Hospital Limerick",               main:"(061) 301111 / (061) 482219",            ed:"(061) 482120",                                              pcr:"LRH"},
  {county:"Limerick", name:"St John's Hospital Limerick",                main:"(061) 462222",                           ed:"Local Injury Unit (061) 462134",                            pcr:"SJHL"},
  {county:"Louth",    name:"Our Lady of Lourdes Hospital",               main:"(041) 9837601",                          ed:"(041) 9832321",                                             pcr:"OLOL"},
  {county:"Mayo",     name:"Mayo General Hospital",                      main:"(094) 9021733",                          ed:"(094) 9042377",                                             pcr:"MOGH"},
  {county:"Offaly",   name:"Midland Regional Hospital Tullamore",        main:"(057) 9321501",                          ed:"(057) 9358021",                                             pcr:"TMR"},
  {county:"Sligo",    name:"Sligo University Hospital",                  main:"(071) 9171111",                          ed:"(071) 9174506",                                             pcr:"SGH"},
  {county:"Tipperary",name:"Nenagh Hospital",                            main:"(067) 31491",                            ed:"n/a",                                                       pcr:"NRH"},
  {county:"Tipperary",name:"South Tipperary General Hospital, Clonmel",  main:"(052) 6177000",                          ed:"(052) 6177042",                                             pcr:"STGH"},
  {county:"Waterford",name:"University Hospital Waterford",              main:"(051) 848000",                           ed:"(051) 842444 / (051) 842445 / (051) 842582",                pcr:"WRH"},
  {county:"Westmeath",name:"Midland Regional Hospital – Mullingar",      main:"(044) 9340221",                          ed:"(044) 9394129",                                             pcr:"MMR"},
  {county:"Wexford",  name:"Wexford General Hospital",                   main:"(053) 9153000",                          ed:"(053) 9153313",                                             pcr:"WGH"}
];

// ─── PRIMARY PCI LINE ─────────────────────────────────────────────────────────
const PCI_NUMBER = "1800 74 22 22";

const PCI_LABS = [
  {n:1, hospital:"University Hospital Galway"},
  {n:2, hospital:"University Hospital Limerick"},
  {n:3, hospital:"Cork University Hospital"},
  {n:4, hospital:"University Hospital Waterford"},
  {n:5, hospital:"Mater Misericordiae Hospital, Dublin"},
  {n:6, hospital:"St Vincent's University Hospital, Dublin"},
  {n:7, hospital:"St James's Hospital, Dublin"},
  {n:8, hospital:"Altnagelvin Hospital, Derry"}
];
