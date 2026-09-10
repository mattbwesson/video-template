/**
 * The customer logo wall's 7 x 13 matrix, cell by cell.
 *
 * Every tile is a PNG cut from docs/reference/Conclusion Logos.png by
 * scripts/prep-customer-logos.py — the wall rendered at four times the frame, so each
 * tile is the real artwork at roughly 400px across, where the earlier set had been read
 * off the reference video at 90. The centre cell is the Workvivo tile the grid draws from
 * an SVG; it carries no `src`.
 *
 * The two edge columns are cut by the reference's own edge, on the side the film never
 * shows: at the wall's widest the outer cards overhang the frame by 106px of their 146.
 * They used to be drawn placeholders under invented names ("TrainCorp", "Fraport",
 * "Cordell"…); the reference names them, and those are the names here.
 */
export const CUSTOMER_GRID_ROWS: Array<Array<{ id: string; name: string; src?: string; center?: true }>> = [
  // ROW 1
  [
    { id: "graincorp", name: "GrainCorp", src: "img/customer-logos/graincorp.png" },
    { id: "trajan", name: "TRAJAN", src: "img/customer-logos/trajan.png" },
    { id: "visy", name: "VISY", src: "img/customer-logos/visy.png" },
    { id: "huboo", name: "Huboo", src: "img/customer-logos/huboo.png" },
    { id: "uta", name: "UTA", src: "img/customer-logos/uta.png" },
    { id: "virgin", name: "Virgin", src: "img/customer-logos/virgin.png" },
    { id: "zailab", name: "zailab", src: "img/customer-logos/zailab.png" },
    { id: "james_whelan", name: "James Whelan", src: "img/customer-logos/james-whelan.png" },
    { id: "kindred", name: "kindred", src: "img/customer-logos/kindred.png" },
    { id: "port_tauranga", name: "Port of Tauranga", src: "img/customer-logos/port-of-tauranga.png" },
    { id: "airasia", name: "AirAsia", src: "img/customer-logos/airasia.png" },
    { id: "gxo", name: "GXO", src: "img/customer-logos/gxo.png" },
    { id: "frauscher", name: "Frauscher", src: "img/customer-logos/frauscher.png" },
  ],
  // ROW 2
  [
    { id: "nordell", name: "Nordell", src: "img/customer-logos/nordell.png" },
    { id: "inghams", name: "Ingham's", src: "img/customer-logos/inghams.png" },
    { id: "irish_rail", name: "Iarnród Éireann", src: "img/customer-logos/irish-rail.png" },
    { id: "bus_eireann", name: "Bus Éireann", src: "img/customer-logos/bus-eireann.png" },
    { id: "virgin_australia", name: "Virgin Australia", src: "img/customer-logos/virgin-australia.png" },
    { id: "fujifilm", name: "FUJIFILM", src: "img/customer-logos/fujifilm-biosciences.png" },
    { id: "exos", name: "EXOS", src: "img/customer-logos/exos.png" },
    { id: "uniphar", name: "Uniphar", src: "img/customer-logos/uniphar.png" },
    { id: "amazon", name: "Amazon", src: "img/customer-logos/amazon.png" },
    { id: "jamul_casino", name: "Jamul Casino", src: "img/customer-logos/jamul-casino.png" },
    { id: "scoot", name: "Scoot", src: "img/customer-logos/scoot.png" },
    { id: "melbourne_airport_1", name: "Melbourne Airport", src: "img/customer-logos/melbourne-airport.png" },
    { id: "evri", name: "Evri", src: "img/customer-logos/evri.png" },
  ],
  // ROW 3
  [
    { id: "osterman", name: "Osterman", src: "img/customer-logos/osterman.png" },
    { id: "ajinomoto", name: "Ajinomoto", src: "img/customer-logos/ajinomoto.png" },
    { id: "walden", name: "Walden", src: "img/customer-logos/walden.png" },
    { id: "air_india", name: "Air India", src: "img/customer-logos/air-india.png" },
    { id: "walmart", name: "Walmart", src: "img/customer-logos/walmart.png" },
    { id: "wider_circle", name: "Wider Circle", src: "img/customer-logos/wider-circle.png" },
    { id: "arh", name: "ARH", src: "img/customer-logos/appalachian-regional-healthcare.png" },
    { id: "spring_health", name: "Spring Health", src: "img/customer-logos/spring-health.png" },
    { id: "white_castle", name: "White Castle", src: "img/customer-logos/white-castle.png" },
    { id: "delta", name: "Delta", src: "img/customer-logos/delta.png" },
    { id: "flexjet_1", name: "Flexjet", src: "img/customer-logos/flexjet.png" },
    { id: "skycity", name: "SkyCity", src: "img/customer-logos/skycity.png" },
    { id: "grilld", name: "Grill'd", src: "img/customer-logos/grilld.png" },
  ],
  // ROW 4 (CENTER HERO ROW)
  [
    { id: "bimeda_2", name: "Bimeda", src: "img/customer-logos/bimeda-alt.png" },
    { id: "melbourne_airport_2", name: "Melbourne Airport", src: "img/customer-logos/melbourne-airport-alt.png" },
    { id: "changi", name: "Changi Airport Group", src: "img/customer-logos/changi-airport-group.png" },
    { id: "ryanair", name: "Ryanair", src: "img/customer-logos/ryanair.png" },
    { id: "valor", name: "Valor", src: "img/customer-logos/valor.png" },
    { id: "nhs_royal_berkshire", name: "NHS Royal Berkshire", src: "img/customer-logos/nhs-royal-berkshire.png" },
    // CENTER: the grid draws this cell from img/workvivo-tile.svg. `center` is what the
    // grid keys on — not the cell's position — so a row edit cannot move the mark.
    { id: "workvivo_center", name: "Workvivo", center: true },
    { id: "bupa", name: "Bupa", src: "img/customer-logos/bupa.png" },
    { id: "london_ambulance", name: "NHS London Ambulance Service", src: "img/customer-logos/london-ambulance-service.png" },
    { id: "amc", name: "AMC Theatres", src: "img/customer-logos/amc-theatres.png" },
    { id: "fish", name: "Fish", src: "img/customer-logos/unidentified-fish-mark.png" },
    { id: "rsl_australia", name: "RSL Australia", src: "img/customer-logos/rsl-australia.png" },
    { id: "adelaide", name: "Adelaide", src: "img/customer-logos/adelaide.png" },
  ],
  // ROW 5
  [
    { id: "tao_group", name: "Tao Group Hospitality", src: "img/customer-logos/tao-group-hospitality.png" },
    { id: "sentient_jet", name: "Sentient Jet", src: "img/customer-logos/sentientjet.png" },
    { id: "airnav_ireland", name: "AirNav Ireland", src: "img/customer-logos/airnav-ireland.png" },
    { id: "wizz", name: "Wizz Air", src: "img/customer-logos/wizz-air.png" },
    { id: "volvo", name: "VOLVO", src: "img/customer-logos/volvo.png" },
    { id: "empirx", name: "Empirx Health", src: "img/customer-logos/empirx-health.png" },
    { id: "greater_good", name: "Greater Good Health", src: "img/customer-logos/greater-good-health.png" },
    { id: "pms", name: "PMS", src: "img/customer-logos/pms-presbyterian-medical-services.png" },
    { id: "pettitts", name: "Pettitt's", src: "img/customer-logos/pettitts.png" },
    { id: "endeavour_group", name: "Endeavour Group", src: "img/customer-logos/endeavour-group.png" },
    { id: "insomnia", name: "Insomnia Coffee", src: "img/customer-logos/insomnia-coffee.png" },
    { id: "gordon_food", name: "Gordon Food Service", src: "img/customer-logos/gordon-food-service.png" },
    { id: "emaar", name: "Emaar", src: "img/customer-logos/emaar.png" },
  ],
  // ROW 6
  [
    { id: "lixil", name: "LIXIL", src: "img/customer-logos/lixil.png" },
    { id: "san_diego_airport", name: "San Diego Airport", src: "img/customer-logos/san-diego-international-airport.png" },
    { id: "aerocloud", name: "AeroCloud", src: "img/customer-logos/aerocloud.png" },
    { id: "hickorys", name: "Hickory's Smokehouse", src: "img/customer-logos/hickorys-smokehouse.png" },
    { id: "am_fresh", name: "AM FRESH Group", src: "img/customer-logos/am-fresh-group.png" },
    { id: "aib", name: "AIB", src: "img/customer-logos/aib.png" },
    { id: "bimeda", name: "Bimeda", src: "img/customer-logos/bimeda.png" },
    { id: "harris_farm", name: "Harris Farm Markets", src: "img/customer-logos/harris-farm-markets.png" },
    { id: "woodies", name: "Woodie's", src: "img/customer-logos/woodies.png" },
    { id: "kmart", name: "Kmart", src: "img/customer-logos/kmart.png" },
    { id: "koko_black", name: "Koko Black", src: "img/customer-logos/koko-black.png" },
    { id: "winc", name: "Winc", src: "img/customer-logos/winc.png" },
    { id: "topgolf", name: "Topgolf", src: "img/customer-logos/topgolf.png" },
  ],
  // ROW 7
  [
    { id: "airlite", name: "Airlite Plastics", src: "img/customer-logos/airlite-plastics.png" },
    { id: "corp_wings", name: "Corporate Wings", src: "img/customer-logos/corporate-wings.png" },
    { id: "aer_lingus", name: "Aer Lingus", src: "img/customer-logos/aer-lingus.png" },
    { id: "madison_square_garden", name: "Madison Square Garden", src: "img/customer-logos/madison-square-garden.png" },
    { id: "salt_straw", name: "Salt & Straw", src: "img/customer-logos/salt-and-straw.png" },
    { id: "gsk", name: "GSK", src: "img/customer-logos/gsk.png" },
    { id: "scope", name: "SCOPE", src: "img/customer-logos/scope.png" },
    { id: "iceland", name: "Iceland", src: "img/customer-logos/iceland.png" },
    { id: "rue_gilt", name: "Rue Gilt Groupe", src: "img/customer-logos/rue-gilt-groupe.png" },
    { id: "bishs_rv", name: "Bish's RV", src: "img/customer-logos/bishs-rv.png" },
    { id: "maxi_zoo", name: "Maxi Zoo", src: "img/customer-logos/maxi-zoo.png" },
    { id: "thirty_one", name: "Thirty-One", src: "img/customer-logos/thirty-one.png" },
    { id: "sports_endeavors", name: "Sports Endeavors", src: "img/customer-logos/sports-endeavors.png" },
  ],
];
