#!/usr/bin/env python3
"""Emit tmp/i18n-payloads/b5l-model-onboarding.json for merge script."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tmp/i18n-payloads/b5l-model-onboarding.json"


def set_nested(dst: dict, keys: list[str], value: str):
    for k in keys[:-1]:
        dst = dst.setdefault(k, {})
    dst[keys[-1]] = value


def add_rows(rows: list[tuple[str, str, str, str, str]], buckets: dict):
    for key, en, de, fr, es in rows:
        ks = key.split(".")
        for loc, val in (("en", en), ("de", de), ("fr", fr), ("es", es)):
            set_nested(buckets.setdefault(loc, {}), ["onboarding", "model"] + ks, val)


def main():
    b: dict[str, dict] = {}
    rows: list[tuple[str, str, str, str, str]] = []

    def R(key, en, de, fr, es):
        rows.append((key, en, de, fr, es))

    # Navigation & shared
    R("nav.back", "Back", "Zurück", "Retour", "Volver")
    R("nav.next", "Next Step", "Weiter", "Étape suivante", "Siguiente paso")
    R("nav.finish", "FINISH", "FERTIG", "TERMINER", "FINALIZAR")
    R("nav.saving", "Saving...", "Wird gespeichert …", "Enregistrement…", "Guardando…")
    R("optional", "optional", "optional", "facultatif", "opcional")
    R("selectOption", "Select option", "Option wählen", "Choisir une option", "Seleccionar opción")
    R("selectGender", "Select gender", "Geschlecht wählen", "Choisir le genre", "Seleccionar género")
    R("selectEthnicity", "Select ethnicity", "Ethnie wählen", "Choisir une ethnie", "Seleccionar etnia")
    R("selectNationality", "Select nationality", "Nationalität wählen", "Choisir la nationalité", "Seleccionar nacionalidad")
    R("selectHair", "Select hair color", "Haarfarbe wählen", "Couleur de cheveux", "Color de pelo")
    R("selectEye", "Select eye color", "Augenfarbe wählen", "Couleur des yeux", "Color de ojos")
    R("selectSize", "Select size", "Grösse wählen", "Choisir la taille", "Seleccionar talla")
    R("selectLanguage", "Select language", "Sprache wählen", "Choisir la langue", "Seleccionar idioma")
    R("delete", "Delete", "Löschen", "Supprimer", "Eliminar")
    R("remove", "Remove", "Entfernen", "Retirar", "Quitar")
    R("add", "ADD", "HINZU", "AJOUTER", "AÑADIR")
    R("chf", "CHF", "CHF", "CHF", "CHF")

    # Errors
    R("err.selectLanguageFirst", "Please select a language first", "Bitte zuerst eine Sprache wählen", "Veuillez d’abord choisir une langue", "Primero elige un idioma")
    R("err.selectLanguage", "Please select a language", "Bitte eine Sprache wählen", "Veuillez choisir une langue", "Selecciona un idioma")
    R("err.selectLevel", "Please select a level", "Bitte ein Niveau wählen", "Veuillez choisir un niveau", "Selecciona un nivel")
    R("err.languageExists", "Language already added", "Sprache bereits hinzugefügt", "Langue déjà ajoutée", "Idioma ya añadido")
    R("err.maxLanguages", "Maximum 5 languages allowed", "Maximal 5 Sprachen erlaubt", "5 langues maximum", "Máximo 5 idiomas")
    R("err.shownameGender", "Showname and Gender are required", "Künstlername und Geschlecht sind Pflicht", "Nom d’artiste et genre obligatoires", "Nombre artístico y género obligatorios")
    R("err.phone", "Phone number is required", "Telefonnummer ist erforderlich", "Le téléphone est obligatoire", "El teléfono es obligatorio")
    R("err.ageRange", "Age must be between 18 and 100", "Alter zwischen 18 und 100", "Âge entre 18 et 100", "Edad entre 18 y 100")
    R("err.saveDetails", "Failed to save details", "Speichern fehlgeschlagen", "Échec de l’enregistrement", "No se pudieron guardar los datos")

    # Alerts
    R("alert.validAmount", "Please enter a valid amount", "Bitte einen gültigen Betrag eingeben", "Entrez un montant valide", "Introduce un importe válido")
    R("alert.validTime", "Please enter a valid time duration", "Bitte eine gültige Zeitspanne eingeben", "Durée horaire invalide", "Introduce una duración válida")
    R("alert.durationExists", "This duration already exists. Please remove it first.", "Diese Dauer existiert bereits.", "Cette durée existe déjà.", "Esta duración ya existe.")
    R("alert.durationExistsCustom", "This specific time duration already exists. Please remove it first.", "Diese benutzerdefinierte Dauer existiert bereits.", "Cette durée personnalisée existe déjà.", "Esta duración personalizada ya existe.")
    R("alert.fileTooLarge", "{name} is too large. Max size is 10MB.", "{name} ist zu gross. Max. 10 MB.", "{name} est trop volumineux. Max 10 Mo.", "{name} es demasiado grande. Máx. 10 MB.")
    R("alert.videoTooLarge", "{name} is too large. Max size is 200MB.", "{name} ist zu gross. Max. 200 MB.", "{name} trop volumineux. Max 200 Mo.", "{name} demasiado grande. Máx. 200 MB.")
    R("alert.videoFormat", "{name} is not a valid video format. Allowed: MP4, MOV, WMV, FLV, AVI, MKV.", "{name}: ungültiges Videoformat.", "{name}: format vidéo invalide.", "{name}: formato de vídeo no válido.")
    R("alert.uploadPhotosFail", "Failed to upload photos. Please try again.", "Foto-Upload fehlgeschlagen.", "Échec du téléchargement des photos.", "Error al subir fotos.")
    R("alert.uploadVideosFail", "Failed to upload videos. Please try again.", "Video-Upload fehlgeschlagen.", "Échec du téléchargement des vidéos.", "Error al subir vídeos.")
    R("alert.deletePhotoFail", "Failed to delete photo.", "Foto konnte nicht gelöscht werden.", "Impossible de supprimer la photo.", "No se pudo borrar la foto.")
    R("alert.deleteVideoFail", "Failed to delete video.", "Video konnte nicht gelöscht werden.", "Impossible de supprimer la vidéo.", "No se pudo borrar el vídeo.")

    # Confirm
    R("confirm.deletePhoto", "Are you sure you want to delete this photo?", "Dieses Foto wirklich löschen?", "Supprimer cette photo ?", "¿Eliminar esta foto?")
    R("confirm.deleteVideo", "Are you sure you want to delete this video?", "Dieses Video wirklich löschen?", "Supprimer cette vidéo ?", "¿Eliminar este vídeo?")

    # New language sub-component
    R("lang.addAnother", "Add Another Language", "Weitere Sprache hinzufügen", "Ajouter une langue", "Añadir otro idioma")
    R("lang.level", "Level", "Niveau", "Niveau", "Nivel")
    R("lang.levelBasic", "Basic", "Grundkenntnisse", "Basique", "Básico")
    R("lang.levelFair", "Fair", "Mittel", "Moyen", "Medio")
    R("lang.levelGood", "Good", "Gut", "Bien", "Bueno")
    R("lang.levelExcellent", "Excellent", "Muttersprache / sehr gut", "Excellent", "Excelente")

    # Step 1
    R("s1.title", "Basic BIO", "Basis-BIO", "Bio de base", "Bio básica")
    R("s1.showname", "Showname", "Künstlername", "Nom d’artiste", "Nombre artístico")
    R("s1.shownamePh", "Name on your profile", "Name auf Ihrem Profil", "Nom sur votre profil", "Nombre en tu perfil")
    R("s1.gender", "Gender", "Geschlecht", "Genre", "Género")
    R("s1.genderFemale", "Female", "Weiblich", "Femme", "Mujer")
    R("s1.genderMale", "Male", "Männlich", "Homme", "Hombre")
    R("s1.genderTrans", "Trans", "Trans", "Trans", "Trans")
    R("s1.phone", "Phone Number", "Telefonnummer", "Téléphone", "Teléfono")
    R("s1.phonePh", "Enter phone number", "Telefonnummer eingeben", "Numéro de téléphone", "Introduce el teléfono")
    R("s1.slogan", "Slogan", "Slogan", "Slogan", "Eslogan")
    R("s1.sloganPh", "A short slogan or keyword", "Kurzer Slogan oder Stichwort", "Court slogan ou mot-clé", "Eslogan o palabra clave")
    R("s1.ethnicity", "Ethnicity", "Ethnie", "Ethnie", "Etnia")
    R("s1.nationality", "Nationality", "Nationalität", "Nationalité", "Nacionalidad")
    R("s1.age", "Age", "Alter", "Âge", "Edad")
    R("s1.agePh", "Age", "Alter", "Âge", "Edad")
    R("s1.photos", "Photos", "Fotos", "Photos", "Fotos")
    R("s1.uploading", "Uploading...", "Wird hochgeladen …", "Téléchargement…", "Subiendo…")
    R("s1.clickUpload", "Click to upload photos", "Klicken, um Fotos hochzuladen", "Cliquez pour télécharger", "Clic para subir fotos")
    R("s1.photoHint", "JPG, PNG, WEBP — max 10MB each", "JPG, PNG, WEBP — max. 10 MB pro Datei", "JPG, PNG, WEBP — max 10 Mo chacune", "JPG, PNG, WEBP — máx. 10 MB cada uno")
    R("s1.noPhotosYet", "No photos uploaded yet", "Noch keine Fotos", "Aucune photo pour l’instant", "Aún no hay fotos")

    # Ethnicity options (value=en storage)
    R("eth.asian", "Asian", "Asiatisch", "Asiatique", "Asiática")
    R("eth.black", "Black", "Schwarz", "Noire", "Negra")
    R("eth.caucasian_white", "Caucasian (white)", "Kaukasisch (weiss)", "Caucasienne (blanche)", "Caucásica (blanca)")
    R("eth.latin", "Latin", "Lateinamerikanisch", "Latine", "Latina")
    R("eth.mixed", "Mixed", "Gemischt", "Métissée", "Mixta")
    R("eth.indian", "Indian", "Indisch", "Indienne", "India")
    R("eth.arab", "Arab", "Arabisch", "Arabe", "Árabe")
    R("eth.caucasian", "Caucasian", "Kaukasisch", "Caucasienne", "Caucásica")

    # Step 2
    R("s2.title", "Physical Features", "Körpermerkmale", "Traits physiques", "Rasgos físicos")
    R("s2.hairColor", "Hair Color", "Haarfarbe", "Cheveux", "Color de pelo")
    R("s2.eyeColor", "Eye Color", "Augenfarbe", "Yeux", "Ojos")
    R("s2.hairBlond", "Blond", "Blond", "Blond", "Rubio")
    R("s2.hairLightBrown", "Light brown", "Hellbraun", "Châtain clair", "Castaño claro")
    R("s2.hairBrunette", "Brunette", "Brünett", "Brune", "Morena")
    R("s2.hairBlack", "Black", "Schwarz", "Noirs", "Negro")
    R("s2.hairRed", "Red", "Rot", "Roux", "Pelirrojo")
    R("s2.hairOther", "Other", "Andere", "Autre", "Otro")
    R("s2.eyeBlack", "Black", "Schwarz", "Noirs", "Negro")
    R("s2.eyeBrown", "Brown", "Braun", "Marron", "Marrones")
    R("s2.eyeGreen", "Green", "Grün", "Verts", "Verdes")
    R("s2.eyeBlue", "Blue", "Blau", "Bleus", "Azules")
    R("s2.eyeGray", "Gray", "Grau", "Gris", "Grises")
    R("s2.height", "Height (cm)", "Grösse (cm)", "Taille (cm)", "Altura (cm)")
    R("s2.heightPh", "cm", "cm", "cm", "cm")
    R("s2.weight", "Weight (kg)", "Gewicht (kg)", "Poids (kg)", "Peso (kg)")
    R("s2.weightPh", "kg", "kg", "kg", "kg")
    R("s2.dressSize", "Dress Size", "Konfektionsgrösse", "Taille vestimentaire", "Talla")
    R("s2.bust", "Bust (cm)", "Brustumfang (cm)", "Poitrine (cm)", "Busto (cm)")
    R("s2.waist", "Waist (cm)", "Taille (cm)", "Taille (cm)", "Cintura (cm)")
    R("s2.hip", "Hip (cm)", "Hüfte (cm)", "Hanches (cm)", "Cadera (cm)")
    R("s2.pubicHair", "Pubic Hair", "Intimbehaarung", "Maillot", "Vello púbico")
    R("s2.pubicShavedFull", "Shaved completely", "Komplett rasiert", "Entièrement rasée", "Completamente depilada")
    R("s2.pubicShavedMost", "Shaved mostly", "Grösstenteils rasiert", "En majorité rasée", "Mayormente depilada")
    R("s2.pubicTrimmed", "Trimmed", "Getrimmt", "Taillée", "Recortada")
    R("s2.pubicNatural", "All natural", "Natürlich", "Naturelle", "Natural")

    # Step 3
    R("s3.title", "Additional Information", "Zusätzliche Infos", "Informations complémentaires", "Información adicional")
    R("s3.smoking", "Smoking", "Rauchen", "Tabac", "Fumar")
    R("s3.drinking", "Drinking", "Alkohol", "Alcool", "Beber")
    R("s3.yes", "Yes", "Ja", "Oui", "Sí")
    R("s3.no", "No", "Nein", "Non", "No")
    R("s3.occasionally", "Occasionally", "Gelegentlich", "Parfois", "Ocasionalmente")
    R("s3.specialChars", "Special Characteristics", "Besonderheiten", "Particularités", "Características especiales")
    R("s3.specialCharsPh", "Please mention any special characteristics e.g. tattoos, piercings, etc.", "Besonderheiten z. B. Tattoos, Piercings …", "Précisez tatouages, piercings, etc.", "Tatuajes, piercing, etc.")

    # Step 4
    R("s4.title", "About Me", "Über mich", "À propos", "Sobre mí")
    R("s4.intro", "Describe yourself and write some additional information (optional)", "Beschreiben Sie sich (optional)", "Décrivez-vous (facultatif)", "Descríbete (opcional)")
    R("s4.describe", "Describe yourself", "Selbstbeschreibung", "Votre description", "Descríbete")
    R("s4.placeholder", "Tell us about yourself, your personality, what makes you special...", "Erzählen Sie von sich, Ihrer Persönlichkeit …", "Parlez-nous de vous, de ce qui vous rend unique…", "Cuéntanos tu personalidad y qué te hace especial…")

    # Step 5
    R("s5.title", "Languages", "Sprachen", "Langues", "Idiomas")
    R("s5.intro", "Select the language you speak", "Wählen Sie Ihre Sprache(n)", "Choisissez les langues parlées", "Selecciona los idiomas que hablas")
    R("s5.language", "Language", "Sprache", "Langue", "Idioma")
    R("s5.addMore", "Add More", "Mehr hinzufügen", "Ajouter", "Añadir más")
    R("s5.advancedHint", "You can add up to 5 languages total", "Bis zu 5 Sprachen möglich", "Jusqu’à 5 langues", "Hasta 5 idiomas")
    R("s5.maxReached", "Maximum 5 languages reached", "Maximum 5 Sprachen erreicht", "5 langues maximum atteint", "Máximo 5 idiomas alcanzado")

    # Step 6 — incall/outcall labels (values stay English in state)
    R("s6.title", "Area / Address", "Region / Adresse", "Zone / adresse", "Zona / dirección")
    R("s6.city", "City", "Stadt", "Ville", "Ciudad")
    R("s6.cityPh", "Search city or PLZ...", "Stadt oder PLZ suchen …", "Ville ou NPA…", "Buscar ciudad o CP…")
    R("s6.incall", "Incall", "Incall", "Incall", "Incall")
    R("s6.outcall", "Outcall", "Outcall", "Outcall", "Outcall")
    R("incall.privateApt", "Private apartment", "Privatwohnung", "Appartement privé", "Piso privado")
    R("incall.hotel", "Hotel room", "Hotelzimmer", "Chambre d’hôtel", "Hotel")
    R("incall.club", "Club/Studio", "Club/Studio", "Club/studio", "Club/estudio")
    R("incall.other", "Other", "Andere", "Autre", "Otro")
    R("outcall.hotelOnly", "Hotel visits only", "Nur Hotelbesuche", "Hôtels uniquement", "Solo hoteles")
    R("outcall.homeOnly", "Home visits only", "Nur Hausbesuche", "Domicile uniquement", "Solo domicilio")
    R("outcall.hotelHome", "Hotel and Home visits", "Hotel und Hausbesuche", "Hôtel et domicile", "Hotel y domicilio")

    # Step 7
    R("s7.title", "Services", "Services", "Prestations", "Servicios")
    R("s7.orientation", "Sexual Orientation", "Sexuelle Orientierung", "Orientation sexuelle", "Orientación sexual")
    R("s7.orientationSelect", "Sexual Orientation", "Bitte wählen", "Orientation", "Orientación")
    R("s7.oriHetero", "Heterosexual", "Heterosexuell", "Hétérosexuelle", "Heterosexual")
    R("s7.oriBi", "Bisexual", "Bisexuell", "Bisexuelle", "Bisexual")
    R("s7.oriHomo", "Homosexual", "Homosexuell", "Homosexuelle", "Homosexual")
    R("s7.offeredFor", "Services Offered For", "Angeboten für", "Proposé à", "Ofrecido a")
    R("s7.forMen", "Men", "Herren", "Hommes", "Hombres")
    R("s7.forWomen", "Women", "Damen", "Femmes", "Mujeres")
    R("s7.forCouples", "Couples", "Paare", "Couples", "Parejas")
    R("s7.forTrans", "Trans", "Trans", "Trans", "Trans")
    R("s7.forGays", "Gays", "Gays", "Gays", "Gays")
    R("s7.servicesHeading", "Services", "Services", "Prestations", "Servicios")
    R("s7.selected", "{count, plural, one {# service selected} other {# services selected}}", "{count, plural, one {# Leistung gewählt} other {# Leistungen gewählt}}", "{count, plural, one {# prestation sélectionnée} other {# prestations sélectionnées}}", "{count, plural, one {# servicio seleccionado} other {# servicios seleccionados}}")

    R("cat.main", "Main Services", "Hauptleistungen", "Services principaux", "Servicios principales")
    R("cat.extra", "Extra Services", "Extra-Leistungen", "Services extra", "Servicios extra")
    R("cat.fetish", "Fetish / Bizarre", "Fetisch / Bizarr", "Fétichisme / bizarre", "Fetiche / bizarre")
    R("cat.virtual", "Virtual Services", "Virtuelle Services", "Services virtuels", "Servicios virtuales")
    R("cat.massage", "Massage services without sex!", "Massage ohne Sex!", "Massages sans sexe !", "Masajes sin sexo")

    # Durations
    R("dur.30m", "30 minutes", "30 Minuten", "30 minutes", "30 minutos")
    R("dur.1h", "1 hour", "1 Stunde", "1 heure", "1 hora")
    R("dur.2h", "2 hours", "2 Stunden", "2 heures", "2 horas")
    R("dur.specific", "For a specific time", "Für eine bestimmte Zeit", "Pour une durée précise", "Para una duración concreta")
    R("dur.additional", "Additional hour", "Jede weitere Stunde", "Heure supplémentaire", "Hora adicional")
    R("dur.overnight", "Overnight", "Übernachtung", "Nuitée", "Noche")
    R("dur.dinner", "Dinner date", "Dinnerdate", "Dîner", "Cena")
    R("dur.weekend", "Weekend", "Wochenende", "Week-end", "Fin de semana")
    R("dur.timePh", "Enter time", "Zeit eingeben", "Durée", "Tiempo")
    R("unit.minutes", "minutes", "Minuten", "minutes", "minutos")
    R("unit.hours", "hours", "Stunden", "heures", "horas")

    # Step 8
    R("s8.title", "Working Hours", "Arbeitszeiten", "Horaires", "Horario")
    R("s8.avail247", "I am available 24/7", "Ich bin 24/7 erreichbar", "Disponible 24h/24", "Disponible 24/7")
    R("s8.sameDaily", "The same schedule every day", "Täglich gleiche Zeiten", "Même horaire chaque jour", "El mismo horario cada día")
    R("s8.custom", "Custom Schedule", "Individuelle Zeiten", "Horaires personnalisés", "Horario personalizado")
    R("s8.from", "From", "Von", "De", "Desde")
    R("s8.to", "To", "Bis", "À", "Hasta")
    R("s8.avail247Note", "✓ You will be shown as available 24/7", "✓ Sie werden als 24/7 verfügbar angezeigt", "✓ Affiché(e) comme disponible 24h/24", "✓ Se mostrará disponible 24/7")
    R("day.monday", "Monday", "Montag", "Lundi", "Lunes")
    R("day.tuesday", "Tuesday", "Dienstag", "Mardi", "Martes")
    R("day.wednesday", "Wednesday", "Mittwoch", "Mercredi", "Miércoles")
    R("day.thursday", "Thursday", "Donnerstag", "Jeudi", "Jueves")
    R("day.friday", "Friday", "Freitag", "Vendredi", "Viernes")
    R("day.saturday", "Saturday", "Samstag", "Samedi", "Sábado")
    R("day.sunday", "Sunday", "Sonntag", "Dimanche", "Domingo")

    # Step 9 rates
    R("s9.title", "Rates", "Preise", "Tarifs", "Tarifas")
    R("s9.incallRates", "Incall Rates", "Incall-Preise", "Tarifs incall", "Tarifas incall")
    R("s9.outcallRates", "Outcall Rates", "Outcall-Preise", "Tarifs outcall", "Tarifas outcall")
    R("s9.duration", "Duration", "Dauer", "Durée", "Duración")
    R("s9.noRates", "No rates defined", "Keine Preise definiert", "Aucun tarif", "Sin tarifas")

    # Step 10
    R("s10.title", "Contact Details", "Kontaktdaten", "Coordonnées", "Datos de contacto")
    R("s10.showPhone", "Show phone number", "Telefonnummer anzeigen", "Afficher le téléphone", "Mostrar teléfono")
    R("s10.countryCode", "Country Code", "Ländercode", "Indicatif", "Código país")
    R("s10.phone", "Phone Number", "Telefonnummer", "Téléphone", "Teléfono")
    R("s10.phonePh", "Enter phone number", "Telefonnummer eingeben", "Numéro de téléphone", "Número de teléfono")
    R("s10.phoneHint", "Please provide the country calling code if you use a non-Swiss number", "Bei ausländischer Nummer Landesvorwahl angeben", "Indiquez l’indicatif si hors Suisse", "Indica el prefijo si no es suizo")
    R("s10.instructions", "Instructions", "Hinweise", "Consignes", "Instrucciones")
    R("s10.smsCall", "SMS and Call", "SMS und Anruf", "SMS et appel", "SMS y llamada")
    R("s10.smsOnly", "SMS Only", "Nur SMS", "SMS uniquement", "Solo SMS")
    R("s10.noSms", "No SMS", "Keine SMS", "Pas de SMS", "Sin SMS")
    R("s10.noWithheld", "No Withheld Numbers", "Keine unterdrückten Nummern", "Pas de numéros masqués", "Sin número oculto")
    R("s10.other", "Other", "Sonstiges", "Autre", "Otro")
    R("s10.otherPh", "Additional instructions...", "Weitere Hinweise …", "Instructions supplémentaires…", "Instrucciones adicionales…")

    # Step 11
    R("s11.title", "Pictures / Video", "Bilder / Video", "Photos / vidéo", "Fotos / vídeo")
    R("s11.reqTitle", "Requirements", "Anforderungen", "Exigences", "Requisitos")
    R("s11.req1", "Good quality photos.", "Gute Bildqualität.", "Photos de bonne qualité.", "Buena calidad de imagen.")
    R("s11.req2", "Photo without sexually explicit content.", "Keine explizit sexuellen Motive.", "Pas de contenu sexuellement explicite.", "Sin contenido sexual explícito.")
    R("s11.req3", "400 x 600 px for portrait images.", "400 x 600 px für Hochformat.", "400 × 600 px portrait.", "400 × 600 px retrato.")
    R("s11.req4", "500 x 375 px for landscape images.", "500 × 375 px für Querformat.", "500 × 375 px paysage.", "500 × 375 px apaisado.")
    R("s11.uploadPhoto", "UPLOAD PHOTO", "FOTO HOCHLADEN", "TÉLÉVERSER PHOTO", "SUBIR FOTO")
    R("s11.uploadingCaps", "UPLOADING...", "LÄDT…", "TÉLÉVERSEMENT…", "SUBIENDO…")
    R("s11.galleryEmpty", "Your gallery is empty", "Ihre Galerie ist leer", "Galerie vide", "Tu galería está vacía")
    R("s11.videoTitle", "Video", "Video", "Vidéo", "Vídeo")
    R("s11.videoIntro", "Showing a video in your sedcard makes you unique and spices your profile up! Even a short and simple video taken by smartphone will raise the number of visitors on your profile.", "Ein Video in Ihrer Sedcard hebt Ihr Profil hervor! Schon ein kurzes Handyvideo steigert die Besucherzahl.", "Une vidéo sur votre sedcard vous démarque ! Même un court clip smartphone attire plus de visiteurs.", "Un vídeo en tu sedcard te diferencia. Incluso uno corto con el móvil sube visitas.")
    R("s11.videoReqTitle", "Requirements", "Anforderungen", "Exigences", "Requisitos")
    R("s11.vreq1", "Video Max size is 200mb", "Video max. 200 MB", "Vidéo max 200 Mo", "Vídeo máx. 200 MB")
    R("s11.vreq2", "Allowed video formats: MP4, MOV, WMV, FLV, AVI, MKV", "Formate: MP4, MOV, WMV, FLV, AVI, MKV", "Formats : MP4, MOV, WMV, FLV, AVI, MKV", "Formatos: MP4, MOV, WMV, FLV, AVI, MKV")
    R("s11.vreq3", "Explicit nudity is not allowed", "Keine explizite Nacktheit", "Pas de nudité explicite", "No desnudez explícita")
    R("s11.vreq4", "Min video height is 360px", "Mind. Videohöhe 360 px", "Hauteur min. 360 px", "Altura mín. 360 px")
    R("s11.uploadVideos", "UPLOAD VIDEOS", "VIDEOS HOCHLADEN", "TÉLÉVERSER VIDÉOS", "SUBIR VÍDEOS")
    R("s11.noteTitle", "Note:", "Hinweis:", "Remarque :", "Nota:")
    R("s11.noteBody", "All uploaded photos and videos will be reviewed by our admin team before being published on your profile. You will be notified once they are approved.", "Alle Uploads werden vor Veröffentlichung vom Team geprüft. Sie werden benachrichtigt, sobald sie freigegeben sind.", "Tous les médias sont modérés avant publication. Vous serez averti(e) après validation.", "Todo se revisa antes de publicarse. Te avisaremos al aprobarse.")

    # Language names (LANGUAGES array)
    lang_map = [
        ("English", "English", "Englisch", "Anglais", "Inglés"),
        ("German", "German", "Deutsch", "Allemand", "Alemán"),
        ("French", "French", "Französisch", "Français", "Francés"),
        ("Italian", "Italian", "Italienisch", "Italien", "Italiano"),
        ("Spanish", "Spanish", "Spanisch", "Espagnol", "Español"),
        ("Portuguese", "Portuguese", "Portugiesisch", "Portugais", "Portugués"),
        ("Russian", "Russian", "Russisch", "Russe", "Ruso"),
        ("Arabic", "Arabic", "Arabisch", "Arabe", "Árabe"),
        ("Chinese", "Chinese", "Chinesisch", "Chinois", "Chino"),
        ("Japanese", "Japanese", "Japanisch", "Japonais", "Japonés"),
        ("Korean", "Korean", "Koreanisch", "Coréen", "Coreano"),
        ("Turkish", "Turkish", "Türkisch", "Turc", "Turco"),
        ("Polish", "Polish", "Polnisch", "Polonais", "Polaco"),
        ("Dutch", "Dutch", "Niederländisch", "Néerlandais", "Neerlandés"),
        ("Swedish", "Swedish", "Schwedisch", "Suédois", "Sueco"),
        ("Norwegian", "Norwegian", "Norwegisch", "Norvégien", "Noruego"),
        ("Danish", "Danish", "Dänisch", "Danois", "Danés"),
        ("Finnish", "Finnish", "Finnisch", "Finnois", "Finés"),
        ("Czech", "Czech", "Tschechisch", "Tchèque", "Checo"),
        ("Romanian", "Romanian", "Rumänisch", "Roumain", "Rumano"),
        ("Greek", "Greek", "Griechisch", "Grec", "Griego"),
        ("Hungarian", "Hungarian", "Ungarisch", "Hongrois", "Húngaro"),
        ("Croatian", "Croatian", "Kroatisch", "Croate", "Croata"),
        ("Serbian", "Serbian", "Serbisch", "Serbe", "Serbio"),
        ("Bulgarian", "Bulgarian", "Bulgarisch", "Bulgare", "Búlgaro"),
        ("Ukrainian", "Ukrainian", "Ukrainisch", "Ukrainien", "Ucraniano"),
        ("Albanian", "Albanian", "Albanisch", "Albanais", "Albanés"),
        ("Hindi", "Hindi", "Hindi", "Hindi", "Hindi"),
        ("Thai", "Thai", "Thailändisch", "Thaï", "Tailandés"),
        ("Vietnamese", "Vietnamese", "Vietnamesisch", "Vietnamien", "Vietnamita"),
        ("Indonesian", "Indonesian", "Indonesisch", "Indonésien", "Indonesio"),
        ("Other", "Other", "Andere", "Autre", "Otro"),
    ]
    for en_name, en, de, fr, es in lang_map:
        key = "langName." + en_name.lower().replace(" ", "_")
        rows.append((key, en, de, fr, es))

    add_rows(rows, b)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    json.dump(b, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
