// Musik-Quiz: 20 Quizze mit je 8 Fragen.
// Aufbau einer Frage: [Frage, richtige Antwort, falsch, falsch, falsch]
// Die App mischt die Reihenfolge der Antworten selbst (auf allen Geräten gleich).
window.KK_QUIZ = [
  { id: "80er", title: "80er-Hits", q: [
    ["Welche Band sang „Take On Me“?", "a-ha", "Duran Duran", "Alphaville", "Europe"],
    ["Aus welchem Land stammt die Band a-ha?", "Norwegen", "Schweden", "Dänemark", "Großbritannien"],
    ["Wer sang „Like a Virgin“?", "Madonna", "Cyndi Lauper", "Kim Wilde", "Whitney Houston"],
    ["Von welcher Band stammt „The Final Countdown“?", "Europe", "Bon Jovi", "Scorpions", "Van Halen"],
    ["Wer veröffentlichte 1982 das Album „Thriller“?", "Michael Jackson", "Prince", "Lionel Richie", "Stevie Wonder"],
    ["Wer sang „Girls Just Want to Have Fun“?", "Cyndi Lauper", "Madonna", "Bananarama", "Tina Turner"],
    ["Welche Band sang „Livin' on a Prayer“?", "Bon Jovi", "Def Leppard", "Guns N' Roses", "Aerosmith"],
    ["Wer sang „99 Luftballons“?", "Nena", "Ideal", "Sandra", "Hubert Kah"]
  ] },
  { id: "90er", title: "90er-Hits", q: [
    ["Welche Gruppe sang „Wannabe“?", "Spice Girls", "All Saints", "TLC", "Destiny's Child"],
    ["Wer wurde 1998 mit „...Baby One More Time“ berühmt?", "Britney Spears", "Christina Aguilera", "Jessica Simpson", "Mandy Moore"],
    ["Von welcher Band stammt „Smells Like Teen Spirit“?", "Nirvana", "Pearl Jam", "Soundgarden", "Green Day"],
    ["Welche Band sang „Wonderwall“?", "Oasis", "Blur", "The Verve", "Pulp"],
    ["Zu welchem Film gehört „My Heart Will Go On“?", "Titanic", "Pretty Woman", "Bodyguard", "Ghost"],
    ["Welche Boyband sang „I Want It That Way“?", "Backstreet Boys", "*NSYNC", "Take That", "Boyzone"],
    ["Welches Duo landete mit „Macarena“ einen Welthit?", "Los del Río", "Gipsy Kings", "Las Ketchup", "Modern Talking"],
    ["Welche Band sang „Zombie“?", "The Cranberries", "No Doubt", "Garbage", "Roxette"]
  ] },
  { id: "2000er", title: "2000er-Hits", q: [
    ["Wer sang „Crazy in Love“?", "Beyoncé", "Rihanna", "Alicia Keys", "Jennifer Lopez"],
    ["Von wem stammt „Hips Don't Lie“?", "Shakira", "Nelly Furtado", "Christina Aguilera", "Jennifer Lopez"],
    ["Wer sang „Umbrella“?", "Rihanna", "Beyoncé", "Ciara", "Leona Lewis"],
    ["Welche Band sang „Mr. Brightside“?", "The Killers", "The Strokes", "Franz Ferdinand", "Kaiser Chiefs"],
    ["Wer sang „Rehab“?", "Amy Winehouse", "Duffy", "Adele", "Lily Allen"],
    ["Wer sang „Poker Face“?", "Lady Gaga", "Katy Perry", "Kesha", "P!nk"],
    ["Von welcher Band stammt „Viva la Vida“?", "Coldplay", "Keane", "Snow Patrol", "Muse"],
    ["Welches Duo sang „Hey Ya!“?", "OutKast", "Gnarls Barkley", "The Black Eyed Peas", "Daft Punk"]
  ] },
  { id: "deutsch", title: "Deutschpop & NDW", q: [
    ["Wer sang „Major Tom (völlig losgelöst)“?", "Peter Schilling", "Falco", "Joachim Witt", "Markus"],
    ["Von wem stammt der Song „Männer“?", "Herbert Grönemeyer", "Marius Müller-Westernhagen", "Udo Lindenberg", "Peter Maffay"],
    ["Wer sang „Haus am See“?", "Peter Fox", "Clueso", "Mark Forster", "Cro"],
    ["Welche Band sang „Tage wie diese“?", "Die Toten Hosen", "Die Ärzte", "Sportfreunde Stiller", "Revolverheld"],
    ["Welche Band besingt „Westerland“?", "Die Ärzte", "Die Toten Hosen", "Fettes Brot", "Die Prinzen"],
    ["Welche Band sang „Ein Kompliment“?", "Sportfreunde Stiller", "Wir sind Helden", "Juli", "Silbermond"],
    ["Wer sang „Rock Me Amadeus“?", "Falco", "Nena", "Peter Schilling", "Trio"],
    ["Wer sang „Auf uns“?", "Andreas Bourani", "Tim Bendzko", "Max Giesinger", "Johannes Oerding"]
  ] },
  { id: "schlager", title: "Schlager", q: [
    ["Wer sang „Atemlos durch die Nacht“?", "Helene Fischer", "Andrea Berg", "Beatrice Egli", "Vanessa Mai"],
    ["Von wem stammt „Griechischer Wein“?", "Udo Jürgens", "Roland Kaiser", "Howard Carpendale", "Costa Cordalis"],
    ["Wer sang „Verdammt, ich lieb' dich“?", "Matthias Reim", "Wolfgang Petry", "Jürgen Drews", "Michael Holm"],
    ["Wer sang „Wahnsinn“ – mit dem berühmten „Hölle, Hölle, Hölle“?", "Wolfgang Petry", "Matthias Reim", "Roland Kaiser", "DJ Ötzi"],
    ["Wer sang „Santa Maria“?", "Roland Kaiser", "Udo Jürgens", "Rex Gildo", "Roy Black"],
    ["Wer sang „Ein Bett im Kornfeld“?", "Jürgen Drews", "Chris Roberts", "Tony Marshall", "Bernd Clüver"],
    ["Wer sang „Marmor, Stein und Eisen bricht“?", "Drafi Deutscher", "Peter Alexander", "Freddy Quinn", "Roy Black"],
    ["Wer sang „Über den Wolken“?", "Reinhard Mey", "Udo Lindenberg", "Hannes Wader", "Konstantin Wecker"]
  ] },
  { id: "rock", title: "Rock-Legenden", q: [
    ["Welche Band spielte „Highway to Hell“?", "AC/DC", "Motörhead", "Kiss", "Aerosmith"],
    ["Von welcher Band stammt „Stairway to Heaven“?", "Led Zeppelin", "Deep Purple", "Pink Floyd", "The Who"],
    ["Welche Band schrieb „Smoke on the Water“?", "Deep Purple", "Black Sabbath", "Led Zeppelin", "Uriah Heep"],
    ["Welche Band sang „Sweet Child o' Mine“?", "Guns N' Roses", "Bon Jovi", "Whitesnake", "Poison"],
    ["Von welcher Band stammt „Nothing Else Matters“?", "Metallica", "Iron Maiden", "Megadeth", "Scorpions"],
    ["Welche deutsche Band sang „Wind of Change“?", "Scorpions", "Rammstein", "Helloween", "Accept"],
    ["Aus welchem Land kommt AC/DC?", "Australien", "USA", "Großbritannien", "Kanada"],
    ["Welche Band sang „Another Brick in the Wall“?", "Pink Floyd", "Genesis", "Queen", "Dire Straits"]
  ] },
  { id: "queen", title: "Queen", q: [
    ["Wie hieß der Sänger von Queen?", "Freddie Mercury", "Brian May", "Roger Taylor", "John Deacon"],
    ["Wer spielt bei Queen Gitarre?", "Brian May", "Roger Taylor", "John Deacon", "Freddie Mercury"],
    ["Auf welchem Album erschien „Bohemian Rhapsody“?", "A Night at the Opera", "News of the World", "Jazz", "The Game"],
    ["Wie viele Mitglieder hatte Queen in der klassischen Besetzung?", "Vier", "Drei", "Fünf", "Sechs"],
    ["Welcher Queen-Song beginnt mit Stampfen und Klatschen?", "We Will Rock You", "Radio Ga Ga", "Don't Stop Me Now", "Killer Queen"],
    ["Wer saß bei Queen am Schlagzeug?", "Roger Taylor", "John Deacon", "Brian May", "Phil Collins"],
    ["Welcher dieser Songs ist NICHT von Queen?", "Eye of the Tiger", "Radio Ga Ga", "Don't Stop Me Now", "Killer Queen"],
    ["Wie heißt der Kinofilm über Queen aus dem Jahr 2018?", "Bohemian Rhapsody", "Rocketman", "We Are the Champions", "A Kind of Magic"]
  ] },
  { id: "abba", title: "ABBA", q: [
    ["Aus welchem Land kommt ABBA?", "Schweden", "Norwegen", "Dänemark", "Niederlande"],
    ["Mit welchem Song gewann ABBA 1974 den Eurovision Song Contest?", "Waterloo", "Mamma Mia", "Fernando", "Dancing Queen"],
    ["Wie viele Mitglieder hat ABBA?", "Vier", "Drei", "Fünf", "Zwei"],
    ["Welches Musical basiert auf den Songs von ABBA?", "Mamma Mia!", "Grease", "Cats", "Hairspray"],
    ["Welcher dieser Songs ist von ABBA?", "Dancing Queen", "Stayin' Alive", "I Will Survive", "Y.M.C.A."],
    ["Woraus setzt sich der Name ABBA zusammen?", "Aus den Anfangsbuchstaben der Vornamen", "Aus einem schwedischen Wort für Musik", "Aus dem Namen ihres Managers", "Aus dem Namen ihrer Heimatstadt"],
    ["In welcher Stadt gewann ABBA 1974 den Eurovision Song Contest?", "Brighton", "London", "Stockholm", "Dublin"],
    ["Wie endet der Titel „The Winner Takes It …“?", "All", "Home", "Away", "Now"]
  ] },
  { id: "beatles", title: "The Beatles", q: [
    ["Aus welcher Stadt stammen die Beatles?", "Liverpool", "London", "Manchester", "Birmingham"],
    ["Wie viele Beatles gab es?", "Vier", "Drei", "Fünf", "Sechs"],
    ["Wer war der Schlagzeuger der Beatles?", "Ringo Starr", "George Harrison", "Paul McCartney", "John Lennon"],
    ["Welche Farbe hat das U-Boot im berühmten Beatles-Song?", "Gelb", "Blau", "Rot", "Grün"],
    ["Auf welchem Albumcover überqueren die Beatles einen Zebrastreifen?", "Abbey Road", "Let It Be", "Help!", "Revolver"],
    ["Welcher Beatle veröffentlichte später solo „Imagine“?", "John Lennon", "Paul McCartney", "George Harrison", "Ringo Starr"],
    ["Wie heißt der Beatles-Song: „Hey …“?", "Jude", "Joe", "Jack", "John"],
    ["Wer war KEIN Mitglied der Beatles?", "Mick Jagger", "George Harrison", "Ringo Starr", "Paul McCartney"]
  ] },
  { id: "ikonen", title: "Pop-Ikonen", q: [
    ["Wer wird „King of Pop“ genannt?", "Michael Jackson", "Elvis Presley", "Prince", "Justin Timberlake"],
    ["Wie heißt Michael Jacksons berühmter Tanzschritt?", "Moonwalk", "Robot", "Twist", "Running Man"],
    ["Wer wird „Queen of Pop“ genannt?", "Madonna", "Cher", "Kylie Minogue", "Britney Spears"],
    ["Wer sang „Purple Rain“?", "Prince", "Michael Jackson", "Lenny Kravitz", "David Bowie"],
    ["In welchem Film singt Whitney Houston „I Will Always Love You“?", "Bodyguard", "Titanic", "Ghost", "Pretty Woman"],
    ["Wer sang „Rocket Man“?", "Elton John", "David Bowie", "Billy Joel", "Rod Stewart"],
    ["Wer sang „Careless Whisper“?", "George Michael", "Phil Collins", "Rick Astley", "Lionel Richie"],
    ["Wer sang 1989 „The Best“?", "Tina Turner", "Whitney Houston", "Cher", "Bonnie Tyler"]
  ] },
  { id: "film", title: "Film & Musical", q: [
    ["Zu welchem Film gehört „Eye of the Tiger“?", "Rocky III", "Top Gun", "Karate Kid", "Rambo"],
    ["Aus welchem Musical stammt „Summer Nights“?", "Grease", "Hairspray", "Mamma Mia!", "Dirty Dancing"],
    ["In welchem Film erklingt „(I've Had) The Time of My Life“?", "Dirty Dancing", "Footloose", "Flashdance", "Grease"],
    ["Wer sang den James-Bond-Titelsong „Skyfall“?", "Adele", "Sam Smith", "Billie Eilish", "Tina Turner"],
    ["Aus welchem Film stammt „Shallow“?", "A Star Is Born", "La La Land", "The Greatest Showman", "Bohemian Rhapsody"],
    ["Von welcher Band stammen die Songs im Musical „Mamma Mia!“?", "ABBA", "Bee Gees", "Queen", "Boney M."],
    ["Wer sang den Titelsong zu „Ghostbusters“?", "Ray Parker Jr.", "Huey Lewis", "Kenny Loggins", "Lionel Richie"],
    ["Aus welchem Musical stammt „Memory“?", "Cats", "Evita", "Les Misérables", "Das Phantom der Oper"]
  ] },
  { id: "disney", title: "Disney", q: [
    ["Aus welchem Film stammt „Let It Go“?", "Die Eiskönigin", "Rapunzel", "Vaiana", "Encanto"],
    ["In welchem Film wird „Hakuna Matata“ gesungen?", "Der König der Löwen", "Das Dschungelbuch", "Tarzan", "Aladdin"],
    ["Zu welchem Film gehört „A Whole New World“?", "Aladdin", "Arielle, die Meerjungfrau", "Pocahontas", "Mulan"],
    ["In welchem Film singt eine Krabbe „Under the Sea“?", "Arielle, die Meerjungfrau", "Findet Nemo", "Vaiana", "Pinocchio"],
    ["Aus welchem Film stammt „Probier's mal mit Gemütlichkeit“?", "Das Dschungelbuch", "Robin Hood", "Aristocats", "Bambi"],
    ["Wie heißt der Schneemann in „Die Eiskönigin“?", "Olaf", "Sven", "Kristoff", "Hans"],
    ["In welchem Film heißt es „Wir reden nicht über Bruno“?", "Encanto", "Coco", "Vaiana", "Raya und der letzte Drache"],
    ["Zu welchem Film gehört „You've Got a Friend in Me“?", "Toy Story", "Cars", "Monster AG", "Oben"]
  ] },
  { id: "esc", title: "Eurovision Song Contest", q: [
    ["Wer gewann 2010 den ESC für Deutschland?", "Lena", "Nicole", "Guildo Horn", "Stefan Raab"],
    ["Mit welchem Lied gewann Nicole 1982?", "Ein bißchen Frieden", "Ein Lied kann eine Brücke sein", "Dschinghis Khan", "Theater"],
    ["Für welches Land gewann Conchita Wurst 2014?", "Österreich", "Deutschland", "Schweiz", "Niederlande"],
    ["Aus welchem Land kommt die zweifache Siegerin Loreen?", "Schweden", "Norwegen", "Finnland", "Dänemark"],
    ["Für welches Land gewann Måneskin 2021?", "Italien", "Spanien", "Frankreich", "Griechenland"],
    ["Für welches Land gewann Alexander Rybak 2009 mit „Fairytale“?", "Norwegen", "Schweden", "Russland", "Island"],
    ["Wie viele Punkte sind die höchste Einzelwertung eines Landes?", "12", "10", "15", "20"],
    ["Für welches Land gewann Céline Dion 1988?", "Schweiz", "Kanada", "Frankreich", "Belgien"]
  ] },
  { id: "weihnachten", title: "Weihnachten", q: [
    ["Welches Duo sang „Last Christmas“?", "Wham!", "Modern Talking", "Eurythmics", "Pet Shop Boys"],
    ["Wer sang „All I Want for Christmas Is You“?", "Mariah Carey", "Whitney Houston", "Céline Dion", "Kelly Clarkson"],
    ["Wer fährt in seinem Song „Driving Home for Christmas“?", "Chris Rea", "Cliff Richard", "Elton John", "Shakin' Stevens"],
    ["Wer sang „In der Weihnachtsbäckerei“?", "Rolf Zuckowski", "Reinhard Mey", "Heino", "Peter Maffay"],
    ["Was bedeutet „Feliz Navidad“?", "Frohe Weihnachten", "Gutes neues Jahr", "Stille Nacht", "Viel Glück"],
    ["Wie heißt das Rentier mit der roten Nase?", "Rudolph", "Blitzen", "Comet", "Dasher"],
    ["Welches Projekt sang 1984 „Do They Know It's Christmas?“?", "Band Aid", "USA for Africa", "Live Aid", "Artists United"],
    ["Aus welchem Land stammt das Lied „Stille Nacht, heilige Nacht“?", "Österreich", "Deutschland", "Schweiz", "Italien"]
  ] },
  { id: "sommer", title: "Sommerhits", q: [
    ["Wer landete mit „Mambo No. 5“ einen Welthit?", "Lou Bega", "Ricky Martin", "Shaggy", "Enrique Iglesias"],
    ["Welche deutsche Band sang „Lemon Tree“?", "Fool's Garden", "Reamonn", "Liquido", "Sportfreunde Stiller"],
    ["Wer sang „Despacito“ zusammen mit Daddy Yankee?", "Luis Fonsi", "Enrique Iglesias", "Pitbull", "J Balvin"],
    ["Welche Gruppe sang „The Ketchup Song“?", "Las Ketchup", "Los del Río", "Loona", "Vengaboys"],
    ["Welche Band sang „Barbie Girl“?", "Aqua", "Vengaboys", "Ace of Base", "Eiffel 65"],
    ["Aus welchem Land kommt PSY, der Sänger von „Gangnam Style“?", "Südkorea", "Japan", "China", "Thailand"],
    ["Welche Gruppe fragte „Who Let the Dogs Out“?", "Baha Men", "Vengaboys", "Rednex", "Scooter"],
    ["Welche Gruppe sang „Blue (Da Ba Dee)“?", "Eiffel 65", "Aqua", "ATC", "Scooter"]
  ] },
  { id: "herkunft", title: "Bands & ihre Herkunft", q: [
    ["Aus welchem Land kommt U2?", "Irland", "Schottland", "England", "USA"],
    ["In welcher Stadt wurde Rammstein gegründet?", "Berlin", "Hamburg", "Leipzig", "München"],
    ["Aus welcher Stadt kommen Die Toten Hosen?", "Düsseldorf", "Köln", "Berlin", "Hamburg"],
    ["Aus welcher Stadt stammen die Scorpions?", "Hannover", "Hamburg", "Frankfurt", "Bremen"],
    ["Aus welchem Land kommt Coldplay?", "Großbritannien", "USA", "Australien", "Irland"],
    ["Aus welcher Stadt stammt Tokio Hotel?", "Magdeburg", "Leipzig", "Dresden", "Berlin"],
    ["Aus welcher Stadt kommen Die Fantastischen Vier?", "Stuttgart", "Hamburg", "Frankfurt", "München"],
    ["Wer bildete mit Dieter Bohlen das Duo Modern Talking?", "Thomas Anders", "Frank Farian", "Howard Carpendale", "Nino de Angelo"]
  ] },
  { id: "wissen", title: "Musikwissen", q: [
    ["Wie viele Saiten hat eine normale Gitarre?", "Sechs", "Vier", "Fünf", "Acht"],
    ["Wie viele Tasten hat ein modernes Klavier?", "88", "76", "61", "100"],
    ["Wie viele Halbtöne hat eine Oktave?", "Zwölf", "Acht", "Sieben", "Zehn"],
    ["Was bedeutet die Vortragsbezeichnung „forte“?", "Laut", "Leise", "Schnell", "Langsam"],
    ["Wie heißt die tiefste Männerstimme?", "Bass", "Tenor", "Bariton", "Alt"],
    ["Wie heißt die höchste Frauenstimme?", "Sopran", "Alt", "Mezzosopran", "Tenor"],
    ["Wer komponierte „Für Elise“?", "Ludwig van Beethoven", "Wolfgang Amadeus Mozart", "Johann Sebastian Bach", "Franz Schubert"],
    ["Wie viele Linien hat ein Notensystem?", "Fünf", "Vier", "Sechs", "Sieben"]
  ] },
  { id: "wersingt", title: "Wer singt's?", q: [
    ["Wer sang „Angels“?", "Robbie Williams", "Ronan Keating", "Gary Barlow", "Bryan Adams"],
    ["Wer sang „Rolling in the Deep“?", "Adele", "Amy Winehouse", "Duffy", "Emeli Sandé"],
    ["Wer sang „Shape of You“?", "Ed Sheeran", "Shawn Mendes", "Justin Bieber", "Sam Smith"],
    ["Wer sang „Sweet Caroline“?", "Neil Diamond", "Tom Jones", "Elvis Presley", "Frank Sinatra"],
    ["Wer sang „I Will Survive“?", "Gloria Gaynor", "Donna Summer", "Diana Ross", "Aretha Franklin"],
    ["Wer sang „Country Roads“?", "John Denver", "Johnny Cash", "Kenny Rogers", "Willie Nelson"],
    ["Wer sang „Total Eclipse of the Heart“?", "Bonnie Tyler", "Kim Wilde", "Tina Turner", "Jennifer Rush"],
    ["Welche Band sang „Don't Stop Believin'“?", "Journey", "Foreigner", "Toto", "Boston"]
  ] },
  { id: "aktuell", title: "Aktuelle Popstars", q: [
    ["Wer sang „Flowers“?", "Miley Cyrus", "Dua Lipa", "Taylor Swift", "Ariana Grande"],
    ["Wer sang „As It Was“?", "Harry Styles", "Shawn Mendes", "Niall Horan", "Lewis Capaldi"],
    ["Wer sang „Blinding Lights“?", "The Weeknd", "Drake", "Post Malone", "Bruno Mars"],
    ["Wer sang „Bad Guy“?", "Billie Eilish", "Olivia Rodrigo", "Lorde", "Halsey"],
    ["Wer sang „Espresso“?", "Sabrina Carpenter", "Chappell Roan", "Olivia Rodrigo", "Tate McRae"],
    ["Wer sang „Shake It Off“?", "Taylor Swift", "Katy Perry", "Meghan Trainor", "Selena Gomez"],
    ["Wer sang „Dance Monkey“?", "Tones and I", "Sia", "Lizzo", "Ava Max"],
    ["Wer sang „Levitating“?", "Dua Lipa", "Doja Cat", "Ariana Grande", "Rita Ora"]
  ] },
  { id: "oldies", title: "Oldies", q: [
    ["Wer gilt als „King of Rock 'n' Roll“?", "Elvis Presley", "Chuck Berry", "Little Richard", "Buddy Holly"],
    ["Wer schrieb und sang „Johnny B. Goode“?", "Chuck Berry", "Elvis Presley", "Jerry Lee Lewis", "Bill Haley"],
    ["Wer sang „Respect“?", "Aretha Franklin", "Tina Turner", "Diana Ross", "Etta James"],
    ["Welche Band sang „(I Can't Get No) Satisfaction“?", "The Rolling Stones", "The Beatles", "The Who", "The Kinks"],
    ["Wer machte „My Way“ weltberühmt?", "Frank Sinatra", "Dean Martin", "Tony Bennett", "Louis Armstrong"],
    ["Wer sang „What a Wonderful World“?", "Louis Armstrong", "Nat King Cole", "Ray Charles", "Frank Sinatra"],
    ["Welche Band sang „Stayin' Alive“?", "Bee Gees", "Earth, Wind & Fire", "Chic", "Village People"],
    ["Wer sang „Ring of Fire“?", "Johnny Cash", "Willie Nelson", "Kenny Rogers", "Elvis Presley"]
  ] }
];
