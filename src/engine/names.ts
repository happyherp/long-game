export const FOUNDER_SURNAMES = [
  'Penner', 'Reimer', 'Dueck', 'Friesen', 'Wiebe', 'Klassen',
  'Loewen', 'Janzen', 'Thiessen', 'Neufeld', 'Hiebert', 'Plett',
  'Toews', 'Harder', 'Funk', 'Bergen', 'Kroeker', 'Unger',
  'Schmidt', 'Epp', 'Peters', 'Martens', 'Fehr', 'Wall',
  'Braun', 'Enns', 'Giesbrecht', 'Hildebrand', 'Dyck', 'Rempel',
]

export const MALE_FIRST_NAMES = [
  'Johann', 'Peter', 'Heinrich', 'Jakob', 'Abraham', 'Isaak',
  'David', 'Cornelius', 'Wilhelm', 'Bernhard', 'Christian', 'Andreas',
  'Johannes', 'Friedrich', 'Hermann', 'Karl', 'Ludwig', 'August',
  'Otto', 'Rudolf', 'Walter', 'Werner', 'Günter', 'Dieter',
  'Gerhard', 'Klaus', 'Horst', 'Manfred', 'Siegfried', 'Helmut',
  'Hans', 'Josef', 'Paul', 'Michael', 'Thomas', 'Stefan',
  'Markus', 'Robert', 'Martin', 'Viktor', 'Rainer', 'Erik',
  'Daniel', 'Alexander', 'Christoph', 'Benjamin', 'Joseph', 'Samuel',
  'Nathaniel', 'Matthias', 'Philipp', 'Simon', 'Zacharias', 'Emanuel',
]

export const FEMALE_FIRST_NAMES = [
  'Helena', 'Maria', 'Anna', 'Katharina', 'Susanna', 'Sara',
  'Margaretha', 'Elisabeth', 'Aganetha', 'Tina', 'Martha', 'Marie',
  'Sophia', 'Rosa', 'Greta', 'Hedwig', 'Gerda', 'Gisela',
  'Irmgard', 'Herta', 'Edith', 'Ruth', 'Dorothea', 'Anita',
  'Waltraud', 'Renate', 'Christine', 'Cornelia', 'Petra', 'Sabine',
  'Monika', 'Brigitte', 'Barbara', 'Claudia', 'Ingrid', 'Sigrid',
  'Ursula', 'Kathleen', 'Dorothy', 'Judith', 'Susan', 'Jessica',
  'Catherine', 'Caroline', 'Margaret', 'Rebecca', 'Rachel', 'Deborah',
  'Hannah', 'Leah', 'Judith', 'Miriam', 'Naomi', 'Ruth',
]

export function getFirstName(sex: number, nameId: number): string {
  if (sex === 0) {
    return FEMALE_FIRST_NAMES[nameId % FEMALE_FIRST_NAMES.length]
  } else {
    return MALE_FIRST_NAMES[nameId % MALE_FIRST_NAMES.length]
  }
}

export function getSurname(lineageId: number): string {
  return FOUNDER_SURNAMES[lineageId % FOUNDER_SURNAMES.length]
}

export function getDisplayName(firstName: string, surname: string): string {
  return `${firstName} ${surname}`
}
