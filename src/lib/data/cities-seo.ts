export interface CityConfig {
  slug: string
  labelDe: string
  dbCityName: string
  dbAreaName: string
  canton: string
  region: string
  introCopyDe: string
  relatedCitySlugs: [string, string, string]
}

export const CITIES: CityConfig[] = [
  {
    slug: 'zurich',
    labelDe: 'Zürich',
    dbCityName: 'Zürich',
    dbAreaName: 'zürich',
    canton: 'ZH',
    region: 'Zürich',
    relatedCitySlugs: ['winterthur', 'zug', 'luzern'],
    introCopyDe: `Zürich ist die grösste Stadt der Schweiz und eines der bedeutendsten Finanz- und Wirtschaftszentren Europas. Die Stadt am Zürichsee vereint einen aktiven Bankensektor, internationale Konzerne und eine lebhafte Kulturszene in kompaktem Stadtgebiet. Mit rund 440'000 Einwohnern in der Kernstadt und über einer Million im Grossraum zählt sie zu den am dichtesten vernetzten Stadtregionen der Alpenländer.

Das Stadtbild ist vielschichtig: Die mittelalterliche Altstadt rund um Grossmünster, Fraumünster und Lindenhügel steht im Kontrast zu den modern umgenutzten Industriequartieren im Westen. Kreis 4 und Kreis 5 – der Bereich um Langstrasse und das ehemalige Fabrikquartier Züri-West – gelten als die lebhaftesten Ausgehzonen der Stadt. Hier reihen sich Bars, Restaurants mit internationaler Küche, Musikklubs und kulturelle Treffpunkte. Im Sommer verlagert sich das Stadtleben an die Quaianlagen des Zürichsees und an das Limmatufer.

Als globaler Finanzplatz zieht Zürich einen konstanten Strom internationaler Geschäftsreisender an. Kongresse, Fachmessen und Unternehmensveranstaltungen füllen das Jahr aus. Hotels der gehobenen Kategorie konzentrieren sich rund um den Hauptbahnhof, im Seefeld-Quartier und im Kreis 1. Die Verkehrsinfrastruktur ist exzellent: Das Tramnetz erschliesst alle Stadtteile, die S-Bahn verbindet Zürich mit dem gesamten Mittelland, und der Flughafen Zürich-Kloten liegt nur rund 12 Zugminuten vom Hauptbahnhof entfernt – einer der bestangebundenen Stadtnahe-Flughäfen Europas.

Kulturell bietet Zürich weit mehr als der Ruf der nüchternen Bankstadt vermuten lässt: Die Kunsthaus-Sammlung, das Opernhaus am See, das Schauspielhaus, das Zürich Film Festival und die Street Parade im Sommer machen die Stadt zu einem vielseitigen Veranstaltungsort das ganze Jahr hindurch.

Auf NiceModels.ch sind verifizierte Escort Models aus Zürich und der Umgebung gelistet. Alle Profile werden vor der Veröffentlichung geprüft – es erscheinen ausschliesslich aktive Inserate. Die Plattform richtet sich an Personen, die diskrete und zuverlässige Begleitung im Raum Zürich suchen.`,
  },
  {
    slug: 'bern',
    labelDe: 'Bern',
    dbCityName: 'Bern',
    dbAreaName: 'bern',
    canton: 'BE',
    region: 'Mittelland',
    relatedCitySlugs: ['lausanne', 'zug', 'basel'],
    introCopyDe: `Bern ist die Bundesstadt der Schweiz und Hauptort des Kantons Bern. Mit rund 140'000 Einwohnern in der Kernstadt ist sie die viertgrösste Stadt des Landes. Trotz ihrer offiziellen Funktion als Bundesstadt trägt Bern nicht den Titel «Hauptstadt» – die Schweiz verzichtet bewusst auf diese Bezeichnung. Das gibt der Stadt eine eigenartige Mischung aus politischer Gewichtigkeit und entspannter Mittelstadt-Atmosphäre.

Die Berner Altstadt ist seit 1983 UNESCO-Weltkulturerbe und gehört zu den besterhaltenen mittelalterlichen Stadtzentren Mitteleuropas. Kennzeichnend sind die rund sechs Kilometer langen Laubengänge, die nahezu lückenlose Flaniermeilen bei jedem Wetter ermöglichen, sowie die zahlreichen Sandsteinbrunnen aus dem 16. Jahrhundert. Wahrzeichen sind das Berner Münster, der Zytglogge-Turm am östlichen Ende der Kramgasse und das Bundeshaus auf der Anhöhe über der Aare. Das Flussquartier Matte mit seinen tieferliegenden Gassen ist eines der malerischsten Winkel der Altstadt.

Das Nachtleben in Bern verteilt sich auf mehrere Achsen: Die Reitschule als alternatives Kulturzentrum nahe dem Bahnhof, diverse Weinbars und Brasserien in der Kramgasse und Gerechtigkeitsgasse sowie Klubs und Livemusik-Lokale rund um Bärenplatz und Schützenmatte. Die Sommerbar an der Aare und die Marzili-Terrassen unterstreichen das entspannte Flair der Stadt.

Bern ist über den Bahnhof Bern gut mit der übrigen Schweiz verbunden: Zürich ist in rund 55 Minuten erreichbar, Basel in etwa einer Stunde, Genf in eineinhalb Stunden. Das Tramnetz erschliesst zuverlässig alle Stadtteile.

Auf NiceModels.ch sind Escort Models in Bern und der Region Mittelland gelistet. Alle Profile sind vor der Schaltung geprüft – du findest ausschliesslich aktive Inserate. Die Plattform richtet sich an Personen, die diskrete Begleitung in der Bundesstadt suchen.`,
  },
  {
    slug: 'basel',
    labelDe: 'Basel',
    dbCityName: 'Basel',
    dbAreaName: 'basel',
    canton: 'BS',
    region: 'Nordwestschweiz',
    relatedCitySlugs: ['bern', 'zurich', 'lausanne'],
    introCopyDe: `Basel liegt im Dreiländereck, wo die Schweiz, Deutschland und Frankreich zusammenstossen, und ist Hauptort des Stadtkantons Basel-Stadt. Mit rund 180'000 Einwohnern ist sie nach Zürich und Genf die drittgrösste Schweizer Stadt. Wirtschaftlich dominiert die pharmazeutische und chemische Industrie: Roche, Novartis und zahlreiche weitere Konzerne haben hier ihren globalen Hauptsitz oder wichtige Forschungsstandorte.

International bekannt ist Basel durch die Art Basel, die grösste Kunstmesse der Welt, sowie durch weitere bedeutende Messen wie die BASELWORLD. Das macht die Stadt zu einem Magneten für ein kulturell versiertes und internationales Publikum, das jährlich in Scharen anreist.

Die Basler Altstadt auf dem Münsterhügel bietet mittelalterliche Substanz in bester Erhaltung. Das Münster, der Marktplatz und der Barfüsserplatz sind die frequentiertesten Orte der Innenstadt. Das Kleinbasler Rhybord auf der Nordseite des Rheins ist im Sommer täglich belebt: Einheimische lagern auf den Treppen am Flussufer, schwimmen in der Strömung und verweilen in den zahlreichen Restaurants. Das Nachtleben verteilt sich auf die Steinenvorstadt, das Kasernenareal und Lokale in Altstadt und Gundeldinger Quartier.

Die Lage im Dreiländereck macht Basel von allen Seiten gut erreichbar: aus Deutschland über die Autobahn oder den Badischen Bahnhof, aus Frankreich per TGV. Der Euroairport Basel-Mulhouse-Freiburg verbindet die Region mit zahlreichen europäischen Zielen.

NiceModels.ch bietet verifizierte Escort Models in Basel. Die Inserate umfassen diskrete Begleitungen im Stadtgebiet und der trinationalen Region, von der Innenstadt bis zu Hoteladressen nahe Messe und Flughafen.`,
  },
  {
    slug: 'genf',
    labelDe: 'Genf',
    dbCityName: 'Genève',
    dbAreaName: 'genève',
    canton: 'GE',
    region: 'Genferseeregion',
    relatedCitySlugs: ['lausanne', 'bern', 'zurich'],
    introCopyDe: `Genf – auf Französisch Genève – ist eine der internationalsten Städte der Welt. Als Sitz des Europäischen Büros der Vereinten Nationen, des Internationalen Komitees vom Roten Kreuz (IKRK) und über 200 weiterer zwischenstaatlicher Organisationen und NGOs ist Genf das globale diplomatische Nervenzentrum der Schweiz. Die Stadt liegt am südwestlichen Zipfel des Landes, am Ausfluss des Genfersees (Lac Léman), und ist Hauptort des Kantons Genf.

Mit rund 200'000 Einwohnern in der Kernstadt und fast 600'000 im Grossraum zählt Genf zur zweitgrössten Metropolregion der Schweiz. Das kosmopolitische Profil zeigt sich im Alltag: Rund 40 Prozent der Stadtbevölkerung sind Ausländerinnen und Ausländer; Englisch, Arabisch und zahlreiche weitere Sprachen begleiten das Hauptidiom Französisch im Stadtbild.

Die Altstadt (Vieille Ville) auf der Anhöhe rund um die Kathedrale Saint-Pierre bietet enge Gassen, Kunstgalerien und Antiquariate. Das Pâquis-Quartier nahe dem Bahnhof Cornavin ist eines der kosmopolitischsten und belebtesten Quartiere: Restaurants aus aller Welt, eine lebhafte Barszene und eine diverse Bewohnerschaft prägen dieses Viertel. Carouge – ein eigenständig charmantes Kleinstadtquartier südlich der Kernstadt – gilt als Geheimtipp für Nachtleben und Gastronomie.

Der Jet d'Eau, der 140 Meter hohe Wasserstrahl im Genfersee, ist das bekannteste Wahrzeichen. Der Flughafen Genf-Cointrin liegt nur wenige Minuten per Tram oder Bus vom Stadtzentrum entfernt und gehört zu den bestverbundenen Stadtflughäfen Europas.

Auf NiceModels.ch findest du verifizierte Escort Models in Genf. Alle Profile werden vor der Schaltung geprüft. Die Auswahl richtet sich an internationale Gäste, Kongressteilnehmer und Einheimische, die diskrete Begleitung in Genf suchen.`,
  },
  {
    slug: 'lausanne',
    labelDe: 'Lausanne',
    dbCityName: 'Lausanne',
    dbAreaName: 'lausanne',
    canton: 'VD',
    region: 'Genferseeregion',
    relatedCitySlugs: ['genf', 'bern', 'luzern'],
    introCopyDe: `Lausanne ist die Hauptstadt des Kantons Waadt (Vaud) und liegt am Nordufer des Genfersees in einer ausgeprägten Hügeltopografie. Mit rund 140'000 Einwohnern ist sie die viertgrösste Stadt der Schweiz. Die Universität Lausanne (UNIL) und die Eidgenössische Technische Hochschule Lausanne (EPFL) sind zwei der renommiertesten Lehr- und Forschungsinstitute der Schweiz und verleihen der Stadt einen jungen, dynamischen Charakter.

Lausanne ist Sitz des Internationalen Olympischen Komitees (IOC) und vermarktet sich als «olympische Hauptstadt». Das Olympische Museum am Ufer des Genfersees ist ein beliebtes Reiseziel. Kulturell ist Lausanne für eine lebhafte Kunstszene bekannt: Die Collection de l'Art Brut, die Fondation de l'Hermitage und zahlreiche Galerien gehören zur kulturellen Infrastruktur der Stadt.

Das Quartier du Flon – ein ehemaliges Industrieareal im Talkessel zwischen Oberstadt und Bahnhof – ist das Herzstück des Lausanner Nachtlebens. Bars, Nachtklubs, Kinos, Restaurants und Kulturbetriebe haben das Flon zum lebendigsten Treffpunkt der Stadt gemacht. Die Terrassen in Ouchy am Seeufer und die Altstadt auf dem Hügel bieten ganz andere Atmosphären und ergänzen das Angebot.

Die Verbindungen innerhalb der Schweiz sind gut: Genf ist in rund 45 Minuten per Zug erreichbar, Bern in knapp einer Stunde, Zürich in anderthalb Stunden. Die Métro (eine der wenigen U-Bahnen der Schweiz) erschliesst auch die steil ansteigende Innenstadt zuverlässig.

NiceModels.ch listet verifizierte Escort Models in Lausanne und der Region Waadtland. Alle Inserate sind geprüft; die Auswahl richtet sich an Personen, die diskrete Begleitung am Genfersee suchen.`,
  },
  {
    slug: 'luzern',
    labelDe: 'Luzern',
    dbCityName: 'Luzern',
    dbAreaName: 'luzern',
    canton: 'LU',
    region: 'Zentralschweiz',
    relatedCitySlugs: ['zurich', 'bern', 'zug'],
    introCopyDe: `Luzern ist Hauptort des Kantons Luzern und mit rund 82'000 Einwohnern das bevölkerungsreichste Zentrum der Zentralschweiz. Die Stadt liegt an der Stelle, wo die Reuss aus dem Vierwaldstättersee fliesst, und ist von einem Halbkreis von Voralpenbergen umgeben – Pilatus, Rigi und Bürgenstock sind die bekanntesten. Diese Landschaft macht Luzern zu einem der meistbesuchten Reiseziele Mitteleuropas, besonders bei Gästen aus dem ostasiatischen Raum.

Das Stadtbild prägen mittelalterliche Stadtbefestigungen mit den Museggtürmen, die überdachten Holzbrücken (Kapellbrücke mit Wasserturm, Spreuerbrücke), das Luzerner Kultur- und Kongresszentrum (KKL) von Jean Nouvel am Seeufer sowie die belebten Gassen der Altstadt. Die Kapellbrücke, 1333 erbaut, gilt als meistfotografierte Brücke der Schweiz.

Kulturell ist Luzern über die Stadtgrenzen hinaus bekannt: Das Lucerne Festival gehört zu den renommiertesten Klassikmusikfestivals der Welt und zieht jährlich Zehntausende von Musikbegeisterten an. Das Verkehrshaus der Schweiz am Seeufer ist das meistbesuchte Museum des Landes.

Das Nachtleben verteilt sich auf die Altstadt mit Bars und Restaurants, den Geissensteinring nahe dem Bahnhof mit Klubs und Livemusik sowie auf die Schiffstation-Umgebung am See. Die Stadt hat die perfekte Grösse für Ausgehende: klein genug, um zu Fuss erkundbar zu sein, gross genug für ein breites Angebot.

Der Bahnhof Luzern ist Knotenpunkt für die gesamte Zentralschweiz; Zürich ist in rund 45 Minuten erreichbar, Basel in etwas über einer Stunde.

NiceModels.ch listet verifizierte Escort Models in Luzern und der Zentralschweiz. Alle Profile sind vor der Schaltung geprüft. Die Plattform richtet sich an Gäste der Stadt und Einheimische, die diskrete Begleitung in Luzern suchen.`,
  },
  {
    slug: 'winterthur',
    labelDe: 'Winterthur',
    dbCityName: 'Winterthur',
    dbAreaName: 'winterthur',
    canton: 'ZH',
    region: 'Zürich',
    relatedCitySlugs: ['zurich', 'st-gallen', 'bern'],
    introCopyDe: `Winterthur ist mit rund 115'000 Einwohnern die zweitgrösste Stadt des Kantons Zürich und die sechstgrösste der Schweiz. Sie liegt rund 25 Zugminuten nordöstlich von Zürich und ist Teil der Metropolitanregion, hat aber ein eigenständiges Profil: Jahrhundertelang war Winterthur ein bedeutendes Industriezentrum. Die Maschinenfabriken von Sulzer und Rieter prägten das Stadtbild und machten Winterthur zu einer der wohlhabendsten Arbeiterstädte der Schweiz. Die ehemaligen Werksgelände werden heute als Kultur- und Kreativräume genutzt – das Sulzerareal und das Lagerplatz-Quartier sind die bekanntesten Beispiele.

Die Altstadt mit der Marktgasse und den erhaltenen Arkadenhäusern ist kompakt und belebt. Winterthur überrascht mit kulturellem Reichtum: Das Kunstmuseum Winterthur beherbergt eine der bedeutendsten europäischen Kunstsammlungen seiner Kategorie, das Fotomuseum Winterthur hat internationalen Ruf, und das Technorama ist das grösste Science-Center der Schweiz.

Das Nachtleben ist lebhafter als der Altstadteindruck vermuten lässt: Bars rund um den Stadtgarten und den Obertor-Bereich, das Albani als etablierter Livemusik-Club, die Alte Kaserne als Kulturzentrum und diverse Restaurants bieten Abwechslung an jedem Wochentag. Die ZHAW (Zürcher Hochschule für Angewandte Wissenschaften) sorgt für einen jugendlichen Bevölkerungsanteil.

Bahnseitig ist Winterthur bestens erschlossen: Mehrere S-Bahn-Linien und Interregio-Verbindungen nach St. Gallen, Schaffhausen und Zürich halten am Hauptbahnhof; auch internationale ICE-Züge machen hier Halt.

NiceModels.ch listet verifizierte Escort Models in Winterthur. Alle Profile sind geprüft, bevor sie online gehen. Die Auswahl richtet sich an Gäste und Einheimische im Raum Winterthur und der nördlichen Agglomeration Zürich.`,
  },
  {
    slug: 'zug',
    labelDe: 'Zug',
    dbCityName: 'Zug',
    dbAreaName: 'zug',
    canton: 'ZG',
    region: 'Zentralschweiz',
    relatedCitySlugs: ['zurich', 'luzern', 'bern'],
    introCopyDe: `Zug ist der Hauptort des gleichnamigen Kantons und mit rund 30'000 Einwohnern eine der wohlhabendsten Kleinstädte der Schweiz. Der Kanton Zug ist für seinen ausgesprochen niedrigen Steuersatz bekannt und hat eine aussergewöhnlich hohe Dichte internationaler Unternehmen, Holding-Gesellschaften und Investmentfonds angezogen. In den letzten Jahren hat sich zudem eine grosse Zahl von Blockchain- und Kryptowährungsunternehmen hier niedergelassen – was dem Ort den Spitznamen «Crypto Valley» eingebracht hat.

Die Altstadt von Zug liegt direkt am Zuger See und ist von bemerkenswerter Geschlossenheit und Intaktheit. Die gut erhaltene mittelalterliche Stadtmauer, der Zytturm aus dem 15. Jahrhundert, die Kolinplatz-Brunnen und die historischen Kirchenbauten prägen den historischen Kern. Die Seepromenade mit dem Stadtpark ist ein beliebter Spazierweg; im Sommer fahren Dampfschiffe auf dem See, der für seinen Fischreichtum bekannt ist.

Kulinarisch ist Zug eine Verbindung aus internationaler Businessküche und lokaler Schweizer Tradition. Die Kolinplatz-Gastronomie und die Uferrestaurants bieten gediegene Abende. Die «Zuger Kirschtorte» – eine regional typische Tortenspezialität – ist die bekannteste kulinarische Eigenheit der Stadt.

Die Nähe zu Zürich (rund 25 Minuten per S-Bahn) und zu Luzern (rund 30 Minuten) macht Zug zu einem attraktiven Wohn- und Geschäftsstandort für Personen, die urbane Infrastruktur schätzen, aber die Ruhe einer Kleinstadt bevorzugen. Trotz – oder gerade wegen – seiner Grösse ist Zug ein Ort mit hohem Pro-Kopf-Einkommen und einer international geprägten Einwohnerschaft.

NiceModels.ch bietet verifizierte Escort Models im Raum Zug. Alle Inserate sind vor der Schaltung geprüft. Die Auswahl richtet sich an Geschäftsreisende und Einheimische im Kanton Zug und der Region Zürich-Süd.`,
  },
  {
    slug: 'st-gallen',
    labelDe: 'St. Gallen',
    dbCityName: 'St. Gallen',
    dbAreaName: 'st. gallen',
    canton: 'SG',
    region: 'Ostschweiz',
    relatedCitySlugs: ['winterthur', 'zurich', 'luzern'],
    introCopyDe: `St. Gallen ist die Hauptstadt des gleichnamigen Kantons und mit rund 80'000 Einwohnern das wirtschaftliche und kulturelle Zentrum der Ostschweiz. Die Stadt liegt auf einer Hügelkuppe im St. Galler Hügelland, zwischen dem Bodensee im Norden und dem Appenzeller Hinterland im Süden, auf einer Höhe von rund 670 Metern. Das gibt ihr ein vergleichsweise raues Klima mit mehr Niederschlag als das Mittelland.

Das überragende Merkmal der Stadt ist das Klosterviertel rund um Stiftskirche und Stiftsbibliothek. Die Stiftsbibliothek des Klosters St. Gallen gehört seit 1983 zum UNESCO-Welterbe und gilt als eine der besterhaltenen Barockbibliotheken der Welt; ihre mittelalterlichen Handschriften sind von unschätzbarem kulturhistorischen Wert. Die Klosterkirche (Kathedrale) mit ihrer zweitürmigen Barockfassade ist das Wahrzeichen der Stadt.

St. Gallen blickt auf eine bedeutende Vergangenheit als Textilindustriestadt zurück: Im 19. und frühen 20. Jahrhundert war die Stickerei und Spitzenfabrikation der Region weltberühmt. Die Universität St. Gallen (HSG) geniesst heute internationalen Ruf in Wirtschaft, Recht und Management und prägt das intellektuelle Profil der Stadt.

Die Innenstadt mit Marktplatz, Arkadengassen und langer Fussgängerzone bietet ein breites Einkaufs- und Gastronomieangebot. Das Nachtleben konzentriert sich rund um die Multergasse und die Engassen sowie auf Klubs im Bahnhofsgebiet. Der Bodensee ist per S-Bahn in rund 20 Minuten erreichbar; Zürich liegt rund eine Stunde entfernt.

NiceModels.ch listet verifizierte Escort Models in St. Gallen und der Ostschweizer Region. Alle Inserate sind geprüft; die Auswahl richtet sich an Gäste der Stadt und der Region Bodensee-Ostschweiz.`,
  },
  {
    slug: 'lugano',
    labelDe: 'Lugano',
    dbCityName: 'Lugano',
    dbAreaName: 'lugano',
    canton: 'TI',
    region: 'Tessin',
    relatedCitySlugs: ['lausanne', 'bern', 'zurich'],
    introCopyDe: `Lugano ist die grösste Stadt des Kantons Tessin und das wirtschaftliche sowie kulturelle Zentrum der Südschweiz. Mit rund 65'000 Einwohnern in der Kernstadt und einer Agglomeration von über 150'000 Personen ist Lugano der drittgrösste Finanzplatz der Schweiz, nach Zürich und Genf. Die Stadt liegt am Luganer See (Lago di Lugano), eingebettet zwischen die bewaldeten Bergkuppen Monte San Salvatore und Monte Brè – eine Lage, die Lugano ihr ausgeprägtes mediterran-alpines Flair verleiht.

Der Charakter der Stadt ist deutlich vom Norden Italiens beeinflusst. Die Amtssprache ist Italienisch; Architektur, Alltagskultur, Gastronomie und gesellschaftlicher Rhythmus erinnern eher an Como oder Locarno als an die Deutschschweizer Städte. Die Altstadt (centro storico) rund um die Piazza della Riforma, die Via Nassa und den Dom San Lorenzo ist kompakt und lebendig. Die Seepromenade (Lungolago) und der Parco Civico sind im Sommer täglich belebt.

Lugano ist bekannt als Standort für private Banking und internationale Vermögensverwaltung; zahlreiche Schweizer und ausländische Banken haben hier Niederlassungen. Das Lugano Film Festival und das Blues to Bop-Musikfestival sind wichtige Kulturereignisse. Die Nähe zu Mailand – etwa eine Stunde per Zug durch den Ceneri-Basistunnel – macht Lugano zu einem internationalen Treffpunkt.

Der Regionalflughafen Lugano-Agno verbindet die Stadt mit Zürich und Genf; über den Flughafen Mailand-Malpensa sind weitere internationale Verbindungen rasch erreichbar.

Auf NiceModels.ch findest du verifizierte Escort Models in Lugano und dem Tessin. Alle Profile sind vor der Schaltung geprüft. Die Auswahl richtet sich an internationale Gäste und Einheimische, die diskrete Begleitung am Luganer See suchen.`,
  },
]

export function getCityBySlug(slug: string): CityConfig | undefined {
  return CITIES.find(c => c.slug === slug)
}

// Reverse lookup for profile pages linking back to their city's landing
// page. Returns undefined for real towns outside the 10 curated cities
// (e.g. "Aarwangen") — callers should render nothing in that case rather
// than guess a nearby city.
export function getCityByDbCityName(dbCityName: string | null | undefined): CityConfig | undefined {
  if (!dbCityName) return undefined
  return CITIES.find(c => c.dbCityName === dbCityName)
}

export function getCityByDbAreaName(dbAreaName: string | null | undefined): CityConfig | undefined {
  if (!dbAreaName) return undefined
  const normalized = dbAreaName.toLowerCase()
  return CITIES.find(c => c.dbAreaName === normalized)
}
