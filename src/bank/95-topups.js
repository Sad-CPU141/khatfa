/* Top-ups: more questions for categories defined in the other files, so every
   topic has at least 20. Each block adds one 200, one extra-niche 400 and one 600. */
const M = KH_BANK.more;
M('fb-clubs', [
  ['e21', 200, 'Which London club plays at the Emirates Stadium?', 'أي نادٍ لندني يلعب على ملعب الإمارات؟', 'Arsenal', 'أرسنال', { s: 'stadiums', r: 'Emirates Stadium' }],
  ['h21', 400, 'Which Istanbul club became the first Turkish side to win a European trophy, the 2000 UEFA Cup?', 'أي نادٍ من إسطنبول أصبح أول فريق تركي يفوز ببطولة أوروبية، كأس الاتحاد الأوروبي ٢٠٠٠؟', 'Galatasaray', 'غلطة سراي', { s: 'world', x: 1, r: '2000 UEFA Cup final' }],
  ['x21', 600, 'Which Scottish club, managed by Alex Ferguson, beat Real Madrid in the 1983 Cup Winners’ Cup final?', 'أي نادٍ إسكتلندي بقيادة أليكس فيرغسون هزم ريال مدريد في نهائي كأس الكؤوس الأوروبية ١٩٨٣؟', 'Aberdeen', 'أبردين', { s: 'europe', r: '1983 European Cup Winners\' Cup final' }],
]);
M('fb-players', [
  ['e21', 200, 'Which Brazilian striker is known as "R9" and "O Fenômeno"?', 'أي مهاجم برازيلي يُلقّب بـ«R9» و«الظاهرة»؟', 'Ronaldo (Nazário)', 'رونالدو (نازاريو)', { s: 'legends', r: 'Ronaldo (Brazilian footballer)' }],
  ['h21', 400, 'Which French striker won the 2022 Ballon d’Or?', 'أي مهاجم فرنسي فاز بالكرة الذهبية ٢٠٢٢؟', 'Karim Benzema', 'كريم بنزيمة', { s: 'awards', x: 1, alt: ['Benzema'], r: '2022 Ballon d\'Or' }],
  ['x21', 600, 'Which Portuguese winger won the 2000 Ballon d’Or?', 'أي جناح برتغالي فاز بالكرة الذهبية عام ٢٠٠٠؟', 'Luís Figo', 'لويس فيغو', { s: 'awards', alt: ['Figo'], r: '2000 Ballon d\'Or' }],
]);
M('fb-worldcup', [
  ['e21', 200, 'Which country won the 2018 World Cup in Russia?', 'أي منتخب فاز بكأس العالم ٢٠١٨ في روسيا؟', 'France', 'فرنسا', { s: 'winners', r: '2018 FIFA World Cup final' }],
  ['h21', 400, 'Who was named best player (Golden Ball) at the 2014 World Cup?', 'من نال جائزة أفضل لاعب (الكرة الذهبية) في كأس العالم ٢٠١٤؟', 'Lionel Messi', 'ليونيل ميسي', { s: 'records', x: 1, alt: ['Messi'], r: '2014 FIFA World Cup awards' }],
  ['x21', 600, 'Which country became the first to win two World Cups in a row, in 1934 and 1938?', 'أي منتخب كان أول من فاز بكأسي عالم متتاليتين في ١٩٣٤ و١٩٣٨؟', 'Italy', 'إيطاليا', { s: 'records', r: '1938 FIFA World Cup' }],
]);
M('fb-pl', [
  ['e21', 200, 'Which club plays its home games at Old Trafford?', 'أي نادٍ يلعب على ملعب أولد ترافورد؟', 'Manchester United', 'مانشستر يونايتد', { s: 'clubs', alt: ['Man United'], r: 'Old Trafford' }],
  ['h21', 400, 'Which manager won the Premier League with Chelsea in his first season, 2004–05?', 'أي مدرب فاز بالدوري الإنجليزي مع تشيلسي في موسمه الأول ٢٠٠٤–٠٥؟', 'José Mourinho', 'جوزيه مورينيو', { s: 'seasons', x: 1, alt: ['Mourinho'], r: '2004–05 Chelsea F.C. season' }],
  ['x21', 600, 'Who scored Manchester City’s title-winning goal against QPR in stoppage time in May 2012?', 'من سجّل هدف التتويج لمانشستر سيتي ضد كوينز بارك رينجرز في الوقت بدل الضائع في مايو ٢٠١٢؟', 'Sergio Agüero', 'سيرخيو أغويرو', { s: 'seasons', alt: ['Aguero'], r: '2011–12 Manchester City F.C. season' }],
]);
M('fb-ucl', [
  ['e21', 200, 'Who is the Champions League’s all-time top scorer?', 'من الهداف التاريخي لدوري أبطال أوروبا؟', 'Cristiano Ronaldo', 'كريستيانو رونالدو', { s: 'records', c: 1, asOf: '2026-06', r: 'List of UEFA Champions League top scorers' }],
  ['h21', 400, 'Which club beat Manchester City in the 2021 Champions League final?', 'أي نادٍ هزم مانشستر سيتي في نهائي دوري الأبطال ٢٠٢١؟', 'Chelsea', 'تشيلسي', { s: 'finals', x: 1, r: '2021 UEFA Champions League final' }],
  ['x21', 600, 'Who scored Bayern Munich’s late winner against Dortmund in the 2013 all-German final?', 'من سجّل هدف فوز بايرن ميونخ المتأخر ضد دورتموند في النهائي الألماني ٢٠١٣؟', 'Arjen Robben', 'آريين روبن', { s: 'finals', alt: ['Robben'], r: '2013 UEFA Champions League final' }],
]);
M('fb-arab', [
  ['e21', 200, 'Which Algerian winger starred for Leicester and Manchester City before joining Al-Ahli in 2023?', 'أي جناح جزائري تألق مع ليستر ومانشستر سيتي قبل انضمامه إلى الأهلي السعودي عام ٢٠٢٣؟', 'Riyad Mahrez', 'رياض محرز', { s: 'arab', alt: ['Mahrez'], r: 'Riyad Mahrez' }],
]);
M('basketball', [
  ['e21', 200, 'What is the NBA’s yearly exhibition game for its best players called?', 'ما اسم المباراة الاستعراضية السنوية لأفضل لاعبي الـNBA؟', 'The All-Star Game', 'مباراة كل النجوم', { s: 'history', r: 'NBA All-Star Game' }],
  ['h21', 400, 'Which German forward led the Dallas Mavericks to the 2011 NBA title?', 'أي لاعب ألماني قاد دالاس مافريكس إلى لقب الـNBA عام ٢٠١١؟', 'Dirk Nowitzki', 'ديرك نوفيتسكي', { s: 'players', x: 1, alt: ['Nowitzki'], r: 'Dirk Nowitzki' }],
  ['x21', 600, 'Which Serbian center won NBA MVP in both 2021 and 2022?', 'أي لاعب ارتكاز صربي فاز بجائزة أفضل لاعب في الـNBA عامي ٢٠٢١ و٢٠٢٢؟', 'Nikola Jokić', 'نيكولا يوكيتش', { s: 'players', alt: ['Jokic'], r: 'Nikola Jokić' }],
]);
M('f1', [
  ['e21', 200, 'Which flag is waved as the winner crosses the line?', 'أي علم يُرفع عندما يعبر الفائز خط النهاية؟', 'The chequered flag', 'العلم المربّع (الشطرنجي)', { s: 'tracks', r: 'Racing flags' }],
  ['h21', 400, 'Which team’s cars are nicknamed the "Silver Arrows"?', 'سيارات أي فريق تُلقّب بـ«الأسهم الفضية»؟', 'Mercedes', 'مرسيدس', { s: 'teams', x: 1, ok: 1, r: 'Silver Arrows' }],
  ['x21', 600, 'Which driver holds the record for the most Formula One race wins?', 'أي سائق يحمل الرقم القياسي لأكثر عدد من الانتصارات في سباقات الفورمولا ١؟', 'Lewis Hamilton', 'لويس هاميلتون', { s: 'drivers', ok: 1, c: 1, asOf: '2026-06', r: 'List of Formula One Grand Prix winners' }],
]);
M('tennis', [
  ['e21', 200, 'What is a serve that the receiver cannot even touch called?', 'ماذا يُسمّى الإرسال الذي لا يستطيع المستقبِل حتى لمسه؟', 'An ace', 'إرسال ساحق (Ace)', { s: 'rules', r: 'Ace (tennis)' }],
  ['h21', 400, 'Which Japanese player won the 2018 US Open, beating Serena Williams in the final?', 'أي لاعبة يابانية فازت ببطولة أمريكا المفتوحة ٢٠١٨ بعد فوزها على سيرينا ويليامز في النهائي؟', 'Naomi Osaka', 'ناومي أوساكا', { s: 'players', x: 1, r: 'Naomi Osaka' }],
  ['x21', 600, 'Which Spanish player beat Novak Djokovic in the 2023 Wimbledon final?', 'أي لاعب إسباني هزم نوفاك ديوكوفيتش في نهائي ويمبلدون ٢٠٢٣؟', 'Carlos Alcaraz', 'كارلوس ألكاراز', { s: 'players', alt: ['Alcaraz'], r: '2023 Wimbledon Championships – Men\'s singles' }],
]);
M('olympics', [
  ['e21', 200, 'Which medal is given to Olympic champions?', 'أي ميدالية تُمنح لأبطال الأولمبياد؟', 'Gold', 'الذهبية', { s: 'games', r: 'Olympic medal' }],
  ['h21', 400, 'Which country hosted the 2016 Summer Olympics?', 'أي دولة استضافت الألعاب الأولمبية الصيفية ٢٠١٦؟', 'Brazil (Rio de Janeiro)', 'البرازيل (ريو دي جانيرو)', { s: 'games', x: 1, alt: ['Brazil'], r: '2016 Summer Olympics' }],
  ['x21', 600, 'Which French town hosted the first Winter Olympics, in 1924?', 'أي بلدة فرنسية استضافت أول ألعاب أولمبية شتوية عام ١٩٢٤؟', 'Chamonix', 'شامونيه', { s: 'games', r: '1924 Winter Olympics' }],
]);
M('combat', [
  ['e21', 200, 'How many rounds is a men’s world-title boxing fight usually scheduled for?', 'كم جولة تُحدَّد عادةً لنزال ملاكمة على لقب عالمي للرجال؟', '12', '١٢', { s: 'boxing', r: 'Boxing' }],
  ['h21', 400, 'Which Ukrainian brothers dominated heavyweight boxing in the 2000s and early 2010s?', 'أي أخوين أوكرانيين سيطرا على الوزن الثقيل في الملاكمة في العقد الأول من الألفية وبداية الثاني؟', 'Vitali and Wladimir Klitschko', 'فيتالي وفلاديمير كليتشكو', { s: 'boxing', x: 1, alt: ['the Klitschkos'], r: 'Klitschko brothers' }],
  ['x21', 600, 'Who beat Muhammad Ali in the 1971 "Fight of the Century"?', 'من هزم محمد علي في «نزال القرن» عام ١٩٧١؟', 'Joe Frazier', 'جو فريزر', { s: 'boxing', r: 'Fight of the Century' }],
]);
M('sports-more', [
  ['e21', 200, 'In golf, what is a score of one under par on a hole called?', 'في الغولف، ماذا تُسمّى النتيجة الأقل من المعدّل بضربة واحدة في الحفرة؟', 'A birdie', 'بيردي', { s: 'golf', r: 'Birdie (golf)' }],
  ['e22', 200, 'In rugby union, how many points is a try worth?', 'في الرغبي (اتحاد)، كم نقطة تساوي المحاولة (Try)؟', 'Five', 'خمس نقاط', { s: 'other', alt: ['5'], r: 'Try (rugby)' }],
  ['h21', 400, 'Which country won the 2023 Rugby World Cup?', 'أي منتخب فاز بكأس العالم للرغبي ٢٠٢٣؟', 'South Africa', 'جنوب أفريقيا', { s: 'other', x: 1, r: '2023 Rugby World Cup final' }],
  ['x21', 600, 'In golf, what is a score of three under par on a single hole called?', 'في الغولف، ماذا تُسمّى النتيجة الأقل من المعدّل بثلاث ضربات في حفرة واحدة؟', 'An albatross (double eagle)', 'ألباتروس (دبل إيغل)', { s: 'golf', r: 'Albatross (golf)' }],
]);
M('movies', [
  ['e21', 200, 'Which actor played Tony Stark (Iron Man) in the Marvel films?', 'أي ممثل أدى دور توني ستارك (الرجل الحديدي) في أفلام مارفل؟', 'Robert Downey Jr.', 'روبرت داوني جونيور', { s: 'people', r: 'Robert Downey Jr.' }],
  ['h21', 400, 'Which 1994 film follows a man telling his life story on a bench while waiting for a bus?', 'أي فيلم عام ١٩٩٤ يتابع رجلاً يروي قصة حياته على مقعد بانتظار الحافلة؟', 'Forrest Gump', 'فورست غامب', { s: 'films', x: 1, r: 'Forrest Gump' }],
  ['x21', 600, 'Which film won the very first Academy Award for Best Picture, in 1929?', 'أي فيلم فاز بأول جائزة أوسكار لأفضل فيلم عام ١٩٢٩؟', 'Wings', 'أجنحة (Wings)', { s: 'oscars', x: 1, r: 'Wings (1927 film)' }],
]);
M('animated', [
  ['e21', 200, 'Which Disney film is about the royal sisters Anna and Elsa?', 'أي فيلم من ديزني يدور حول الأختين الملكيتين آنا وإلسا؟', 'Frozen', 'ملكة الثلج (فروزن)', { s: 'disney', f: 'frozen', r: 'Frozen (2013 film)' }],
  ['h21', 400, 'Which Pixar film takes place inside the mind of a girl named Riley?', 'أي فيلم من بيكسار تدور أحداثه داخل عقل فتاة اسمها رايلي؟', 'Inside Out', 'قلباً وقالباً (Inside Out)', { s: 'pixar', x: 1, r: 'Inside Out (2015 film)' }],
  ['x21', 600, 'What is the name of the desk lamp from Pixar’s 1986 short that became its logo?', 'ما اسم المصباح المكتبي من فيلم بيكسار القصير عام ١٩٨٦ الذي أصبح شعارها؟', 'Luxo Jr.', 'لوكسو جونيور', { s: 'pixar', r: 'Luxo Jr.' }],
]);
M('superheroes', [
  ['e21', 200, 'Which superhero is known as "the Man of Steel"?', 'أي بطل خارق يُلقّب بـ«رجل الفولاذ»؟', 'Superman', 'سوبرمان', { s: 'dc', r: 'Superman' }],
  ['h21', 400, 'What is the name of Tony Stark’s company?', 'ما اسم شركة توني ستارك؟', 'Stark Industries', 'ستارك إندستريز', { s: 'marvel', x: 1, r: 'Stark Industries' }],
  ['x21', 600, 'What name does Magneto usually go by in the X-Men comics and films, besides Max Eisenhardt?', 'ما الاسم الذي يُعرف به ماغنيتو عادةً في قصص وأفلام «إكس من»، غير ماكس آيزنهارت؟', 'Erik Lehnsherr', 'إريك لينشر', { s: 'marvel', r: 'Magneto (Marvel Comics)' }],
]);
M('tv', [
  ['e21', 200, 'Which sitcom follows the Pritchett and Dunphy family in a mockumentary style?', 'أي مسلسل كوميدي يتابع عائلتي بريتشيت ودنفي بأسلوب وثائقي ساخر؟', 'Modern Family', 'مودرن فاميلي', { s: 'sitcoms', r: 'Modern Family' }],
  ['h21', 400, 'In Breaking Bad, what is the name of Walter White’s young partner?', 'في «بريكنغ باد»، ما اسم شريك والتر وايت الشاب؟', 'Jesse Pinkman', 'جيسي بينكمان', { s: 'drama', x: 1, r: 'Jesse Pinkman' }],
  ['x21', 600, 'In Friends, what is the name of Joey’s stuffed penguin?', 'في «فريندز»، ما اسم البطريق المحشو الخاص بجوي؟', 'Hugsy', 'هَغزي', { s: 'sitcoms', x: 1, r: 'Joey Tribbiani' }],
]);
M('anime', [
  ['e21', 200, 'Which Studio Ghibli film features a wizard’s walking castle?', 'أي فيلم من استوديو جيبلي فيه قلعة ساحر تمشي؟', 'Howl’s Moving Castle', 'قلعة هاول المتحركة', { s: 'ghibli', r: 'Howl\'s Moving Castle (film)' }],
  ['h21', 400, 'What is the real name of "Deku", the hero of My Hero Academia?', 'ما الاسم الحقيقي لـ«ديكو» بطل «أكاديميتي للأبطال»؟', 'Izuku Midoriya', 'إيزوكو ميدوريا', { s: 'shonen', x: 1, r: 'Izuku Midoriya' }],
  ['x21', 600, 'In Attack on Titan, what is the innermost of the three great walls called?', 'في «هجوم العمالقة»، ما اسم أعمق الأسوار الثلاثة الكبرى؟', 'Wall Sina (Sheena)', 'سور سينا', { s: 'shonen', x: 1, alt: ['Wall Sheena'], r: 'Attack on Titan' }],
]);
M('onepiece', [
  ['e21', 200, 'Which Straw Hat is the crew’s navigator?', 'أي فرد من قبعة القش هو ملّاح الطاقم؟', 'Nami', 'نامي', { s: 'crew', r: 'Nami (One Piece)' }],
  ['h21', 400, 'Which Straw Hat is the crew’s long-nosed sniper?', 'أي فرد من قبعة القش هو قنّاص الطاقم ذو الأنف الطويل؟', 'Usopp', 'أوسوب', { s: 'crew', x: 1, r: 'Usopp' }],
  ['x21', 600, 'What was the name of Gol D. Roger’s ship?', 'ما اسم سفينة غول دي روجر؟', 'The Oro Jackson', 'أورو جاكسون', { s: 'world', x: 1, r: 'Gol D. Roger' }],
]);
M('shonen-classics', [
  ['e21', 200, 'What is Naruto’s favourite food?', 'ما أكلة ناروتو المفضلة؟', 'Ramen', 'الرامن', { s: 'naruto', alt: ['Ichiraku ramen'], r: 'Naruto Uzumaki' }],
  ['h21', 400, 'Which Ninja Academy teacher with a scar across his nose was the first to accept Naruto?', 'أي معلّم في أكاديمية النينجا بندبة على أنفه كان أول من تقبّل ناروتو؟', 'Iruka Umino', 'إيروكا أومينو', { s: 'naruto', x: 1, alt: ['Iruka'], r: 'List of Naruto characters' }],
  ['x21', 600, 'Who is the father of Chi-Chi, Goku’s wife?', 'من والد تشي تشي زوجة غوكو؟', 'The Ox-King', 'الملك الثور', { s: 'db', x: 1, r: 'List of Dragon Ball characters' }],
]);
M('pokemon', [
  ['e21', 200, 'What type is Squirtle?', 'من أي نوع بوكيمون سكويرتل؟', 'Water', 'مائي', { s: 'creatures', r: 'Squirtle' }],
  ['h21', 400, 'Which legendary bird of Kanto is Ice and Flying type?', 'أي طائر أسطوري من كانتو من نوعي الجليد والطيران؟', 'Articuno', 'أرتيكونو', { s: 'creatures', x: 1, r: 'Articuno' }],
  ['x21', 600, 'What is Ash Ketchum called in the original Japanese anime?', 'ماذا يُسمّى آش كيتشم في الأنمي الياباني الأصلي؟', 'Satoshi', 'ساتوشي', { s: 'anime', x: 1, r: 'Ash Ketchum' }],
]);
M('videogames', [
  ['e21', 200, 'Which adventure game series stars the archaeologist Lara Croft?', 'أي سلسلة ألعاب مغامرات بطلتها عالمة الآثار لارا كروفت؟', 'Tomb Raider', 'تومب رايدر', { s: 'characters', r: 'Lara Croft' }],
  ['h21', 400, 'Which 2017 game, known by four letters, set off the battle royale craze before Fortnite’s mode?', 'أي لعبة عام ٢٠١٧ تُعرف بأربعة أحرف أطلقت موضة الباتل رويال قبل طور فورتنايت؟', 'PUBG (PlayerUnknown’s Battlegrounds)', 'ببجي (PUBG)', { s: 'worlds', x: 1, r: 'PUBG: Battlegrounds' }],
  ['x21', 600, 'Who is the silent physicist hero of Half-Life?', 'من بطل «هاف لايف» الفيزيائي الصامت؟', 'Gordon Freeman', 'غوردون فريمان', { s: 'characters', r: 'Gordon Freeman' }],
]);
M('nintendo', [
  ['e21', 200, 'Which Nintendo racing series lets you throw shells and banana peels?', 'أي سلسلة سباقات من نينتندو تتيح لك رمي الأصداف وقشور الموز؟', 'Mario Kart', 'ماريو كارت', { s: 'mario', r: 'Mario Kart' }],
  ['h21', 400, 'Who is Link’s recurring arch-enemy in The Legend of Zelda?', 'من العدو اللدود المتكرر للينك في «أسطورة زيلدا»؟', 'Ganon (Ganondorf)', 'غانون (غانوندورف)', { s: 'zelda', x: 1, alt: ['Ganondorf'], r: 'Ganon' }],
  ['x21', 600, 'What was the Nintendo GameCube’s codename during development?', 'ما الاسم الرمزي لجهاز نينتندو غيم كيوب أثناء تطويره؟', 'Dolphin', 'دولفين', { s: 'company', x: 1, r: 'GameCube' }],
]);
M('gaming-history', [
  ['e21', 200, 'In games, what does "NPC" stand for?', 'في الألعاب، ماذا يعني اختصار «NPC»؟', 'Non-player character', 'شخصية غير قابلة للعب', { s: 'industry', r: 'Non-player character' }],
  ['h21', 400, 'Which 1993 id Software shooter set the template for first-person shooters?', 'أي لعبة تصويب من «إد سوفتوير» عام ١٩٩٣ رسمت ملامح ألعاب التصويب من منظور الشخص الأول؟', 'Doom', 'دووم', { s: 'arcade', x: 1, r: 'Doom (1993 video game)' }],
  ['x21', 600, 'What was Nintendo’s first home video game console, released in Japan in 1977?', 'ما أول جهاز ألعاب منزلي من نينتندو، صدر في اليابان عام ١٩٧٧؟', 'Color TV-Game', 'كولور تي في-غيم', { s: 'consoles', x: 1, r: 'Color TV-Game' }],
]);
M('hiphop', [
  ['e21', 200, 'Which rapper’s real name is Aubrey Graham?', 'أي مغني راب اسمه الحقيقي أوبري غراهام؟', 'Drake', 'دريك', { s: 'artists', ok: 1, r: 'Drake (musician)' }],
  ['h21', 400, 'Which rapper founded the collective Odd Future?', 'أي مغني راب أسس مجموعة «أود فيوتشر»؟', 'Tyler, the Creator', 'تايلر ذا كرييتور', { s: 'artists', x: 1, r: 'Odd Future' }],
  ['x21', 600, 'Watch the Throne (2011) was a joint album by Kanye West and which rapper?', 'ألبوم «Watch the Throne» (٢٠١١) كان ألبوماً مشتركاً بين كانييه ويست وأي مغني راب؟', 'Jay-Z', 'جاي زي', { s: 'albums', ok: 1, r: 'Watch the Throne' }],
]);
M('pop-rock', [
  ['e21', 200, 'Which singer is known as the "Queen of Pop" and the "Material Girl"?', 'أي مغنية تُلقّب بـ«ملكة البوب» و«الفتاة المادية»؟', 'Madonna', 'مادونا', { s: 'singers', r: 'Madonna' }],
  ['h21', 400, 'Which boy band did Harry Styles start out in?', 'في أي فرقة شبابية بدأ هاري ستايلز؟', 'One Direction', 'وان دايركشن', { s: 'bands', x: 1, r: 'One Direction' }],
  ['x21', 600, 'Which band’s 1977 album Rumours is one of the best-selling albums ever?', 'ألبوم «Rumours» عام ١٩٧٧ لأي فرقة من الأكثر مبيعاً في التاريخ؟', 'Fleetwood Mac', 'فليتوود ماك', { s: 'bands', r: 'Rumours (album)' }],
]);
M('music-world', [
  ['e21', 200, 'Which brass instrument uses a sliding tube to change notes?', 'أي آلة نحاسية تستخدم أنبوباً منزلقاً لتغيير النغمات؟', 'The trombone', 'الترومبون', { s: 'instruments', r: 'Trombone' }],
  ['h21', 400, 'Which Polish composer is famous for his nocturnes and études for solo piano?', 'أي مؤلف بولندي يشتهر بمقطوعات «النوكتورن» و«الدراسات» للبيانو المنفرد؟', 'Frédéric Chopin', 'فريدريك شوبان', { s: 'classical', x: 1, alt: ['Chopin'], r: 'Frédéric Chopin' }],
  ['x21', 600, 'Who composed "The Blue Danube" waltz?', 'من ألّف فالس «الدانوب الأزرق»؟', 'Johann Strauss II', 'يوهان شتراوس الابن', { s: 'classical', r: 'The Blue Danube' }],
]);
M('soundtracks', [
  ['e21', 200, '"Hedwig’s Theme" is the famous tune from which film series?', '«لحن هيدويغ» هو اللحن الشهير لأي سلسلة أفلام؟', 'Harry Potter', 'هاري بوتر', { s: 'scores', r: 'Hedwig\'s Theme' }],
  ['h21', 400, 'Who composed the scores for Inception and Interstellar?', 'من ألّف موسيقى فيلمي «استهلال» و«بين النجوم»؟', 'Hans Zimmer', 'هانز زيمر', { s: 'scores', x: 1, ok: 1, r: 'Hans Zimmer' }],
  ['x21', 600, 'Who composed the music for The Godfather (1972)?', 'من ألّف موسيقى فيلم «العرّاب» (١٩٧٢)؟', 'Nino Rota', 'نينو روتا', { s: 'scores', r: 'Nino Rota' }],
]);
M('capitals', [
  ['e21', 200, 'What is the capital of Argentina?', 'ما عاصمة الأرجنتين؟', 'Buenos Aires', 'بوينس آيرس', { s: 'americas', r: 'Buenos Aires' }],
  ['h21', 400, 'What is the capital of Nigeria?', 'ما عاصمة نيجيريا؟', 'Abuja', 'أبوجا', { s: 'africa', x: 1, n: 'Lagos is the largest city.', nAr: 'لاغوس أكبر مدنها.', r: 'Abuja' }],
  ['x21', 600, 'What is the capital of Mongolia?', 'ما عاصمة منغوليا؟', 'Ulaanbaatar', 'أولان باتور', { s: 'asia', r: 'Ulaanbaatar' }],
]);
M('flags', [
  ['e21', 200, 'Which country’s flag has green, white and orange vertical stripes?', 'أي دولة علمها خطوط عمودية خضراء وبيضاء وبرتقالية؟', 'Ireland', 'أيرلندا', { s: 'colours', r: 'Flag of Ireland' }],
  ['h21', 400, 'Which country’s flag shows a red-and-blue taegeuk circle with four black trigrams?', 'أي دولة يتوسط علمها دائرة «تايغوك» حمراء وزرقاء مع أربعة رموز سوداء؟', 'South Korea', 'كوريا الجنوبية', { s: 'symbols', x: 1, r: 'Flag of South Korea' }],
  ['x21', 600, 'Which country’s flag shows the temple of Angkor Wat?', 'أي دولة يظهر في علمها معبد أنغكور وات؟', 'Cambodia', 'كمبوديا', { s: 'symbols', f: 'angkor', r: 'Flag of Cambodia' }],
]);
M('landmarks', [
  ['e21', 200, 'In which Italian city is the famous Leaning Tower?', 'في أي مدينة إيطالية يقع البرج المائل الشهير؟', 'Pisa', 'بيزا', { s: 'ancient', r: 'Leaning Tower of Pisa' }],
  ['h21', 400, 'What is the official name of the London clock tower that houses Big Ben?', 'ما الاسم الرسمي لبرج الساعة في لندن الذي يضم «بيغ بن»؟', 'The Elizabeth Tower', 'برج إليزابيث', { s: 'modern', x: 1, r: 'Big Ben' }],
  ['x21', 600, 'The ancient Statue of Zeus, a wonder of the world, stood at which Greek site?', 'تمثال زيوس القديم، إحدى عجائب الدنيا، كان قائماً في أي موقع يوناني؟', 'Olympia', 'أولمبيا', { s: 'ancient', r: 'Statue of Zeus at Olympia' }],
]);
M('physical-geo', [
  ['e21', 200, 'Which ocean lies between Europe and the Americas?', 'أي محيط يقع بين أوروبا والأمريكتين؟', 'The Atlantic', 'المحيط الأطلسي', { s: 'water', r: 'Atlantic Ocean' }],
  ['h21', 400, 'What is the longest river in Europe?', 'ما أطول نهر في أوروبا؟', 'The Volga', 'نهر الفولغا', { s: 'water', x: 1, r: 'Volga' }],
  ['x21', 600, 'Counting cold deserts, which is the largest desert in the world?', 'باحتساب الصحارى الباردة، ما أكبر صحراء في العالم؟', 'Antarctica (the Antarctic Desert)', 'القارة القطبية الجنوبية (الصحراء القطبية)', { s: 'deserts', ok: 1, r: 'List of deserts by area' }],
]);
M('mideast', [
  ['e21', 200, 'What is the capital of Lebanon?', 'ما عاصمة لبنان؟', 'Beirut', 'بيروت', { s: 'gulf', r: 'Beirut' }],
]);
M('north-america', [
  ['e21', 200, 'In which US city is Hollywood?', 'في أي مدينة أمريكية تقع هوليوود؟', 'Los Angeles', 'لوس أنجلوس', { s: 'usa', r: 'Hollywood' }],
  ['h21', 400, 'What is the capital of British Columbia?', 'ما عاصمة مقاطعة كولومبيا البريطانية؟', 'Victoria', 'فيكتوريا', { s: 'canada', x: 1, n: 'Not Vancouver, the largest city.', nAr: 'ليست فانكوفر، أكبر مدنها.', r: 'Victoria, British Columbia' }],
  ['x21', 600, 'Which is the only officially bilingual (English–French) province in Canada?', 'ما المقاطعة الكندية الوحيدة ثنائية اللغة رسمياً (إنجليزية وفرنسية)؟', 'New Brunswick', 'نيو برونزويك', { s: 'canada', r: 'New Brunswick' }],
]);
M('odd-geo', [
  ['e21', 200, 'Which country is famous for windmills, tulips and canals?', 'أي دولة تشتهر بطواحين الهواء والتوليب والقنوات؟', 'The Netherlands', 'هولندا', { s: 'small', r: 'Netherlands' }],
  ['h21', 400, 'Which Alpine principality lies between Switzerland and Austria?', 'أي إمارة في جبال الألب تقع بين سويسرا والنمسا؟', 'Liechtenstein', 'ليختنشتاين', { s: 'small', x: 1, f: 'liecht', r: 'Liechtenstein' }],
  ['x21', 600, 'Which country has the highest population density in the world?', 'أي دولة لديها أعلى كثافة سكانية في العالم؟', 'Monaco', 'موناكو', { s: 'small', c: 1, asOf: '2026-06', r: 'List of countries and dependencies by population density' }],
]);
M('ancient', [
  ['e21', 200, 'Which ancient people built the Parthenon in Athens?', 'أي شعب قديم بنى البارثينون في أثينا؟', 'The ancient Greeks', 'الإغريق القدماء', { s: 'classical', r: 'Parthenon' }],
  ['h21', 400, 'Which Greek writer is called the "Father of History"?', 'أي كاتب إغريقي يُلقّب بـ«أبي التاريخ»؟', 'Herodotus', 'هيرودوت', { s: 'classical', x: 1, r: 'Herodotus' }],
  ['x21', 600, 'Which wonder of the ancient world is said to have stood in Babylon?', 'أي من عجائب الدنيا القديمة يُقال إنها كانت في بابل؟', 'The Hanging Gardens', 'الحدائق المعلّقة', { s: 'other', r: 'Hanging Gardens of Babylon' }],
]);
M('islamic-history', [
  ['e21', 200, 'In which city is the Dome of the Rock?', 'في أي مدينة تقع قبة الصخرة؟', 'Jerusalem', 'القدس', { s: 'caliphates', r: 'Dome of the Rock' }],
]);
M('modern-history', [
  ['e21', 200, 'Which liner sank on its maiden voyage in 1912 after hitting an iceberg?', 'أي سفينة ركاب غرقت في رحلتها الأولى عام ١٩١٢ بعد اصطدامها بجبل جليدي؟', 'The Titanic', 'تايتانيك', { s: 'other', f: 'titanic', r: 'Titanic' }],
  ['h21', 400, 'Which country did Germany invade on 1 September 1939?', 'أي دولة غزتها ألمانيا في ١ سبتمبر ١٩٣٩؟', 'Poland', 'بولندا', { s: 'ww', x: 1, r: 'Invasion of Poland' }],
  ['x21', 600, 'What name is given to the 1917 revolution that brought the Bolsheviks to power?', 'ما الاسم الذي يُطلق على ثورة ١٩١٧ التي أوصلت البلاشفة إلى الحكم؟', 'The October Revolution', 'ثورة أكتوبر', { s: 'other', r: 'October Revolution' }],
]);
M('inventions', [
  ['e21', 200, 'Samuel Morse’s famous code was made for sending messages by what?', 'شفرة صموئيل مورس الشهيرة صُممت لإرسال الرسائل عبر ماذا؟', 'The (electric) telegraph', 'التلغراف', { s: 'comms', r: 'Morse code' }],
  ['h21', 400, 'Which American engineer invented modern air conditioning in 1902?', 'أي مهندس أمريكي اخترع التكييف الحديث عام ١٩٠٢؟', 'Willis Carrier', 'ويليس كارير', { s: 'machines', x: 1, r: 'Willis Carrier' }],
  ['x21', 600, 'Which Hungarian architecture professor invented his famous cube puzzle in 1974?', 'أي أستاذ عمارة مجري اخترع لغز المكعب الشهير عام ١٩٧٤؟', 'Ernő Rubik', 'إرنو روبيك', { f: 'rubik', s: 'machines', alt: ['Rubik'], r: 'Ernő Rubik' }],
]);
M('rulers', [
  ['e21', 200, 'Which French queen was executed by guillotine in 1793?', 'أي ملكة فرنسية أُعدمت بالمقصلة عام ١٧٩٣؟', 'Marie Antoinette', 'ماري أنطوانيت', { s: 'modern', r: 'Marie Antoinette' }],
  ['h21', 400, 'Which English queen reigned when the Spanish Armada was defeated in 1588?', 'أي ملكة إنجليزية كانت تحكم عندما هُزم الأسطول الإسباني (الأرمادا) عام ١٥٨٨؟', 'Elizabeth I', 'إليزابيث الأولى', { s: 'modern', x: 1, r: 'Spanish Armada' }],
  ['x21', 600, 'Which German-born empress ruled Russia from 1762 to 1796?', 'أي إمبراطورة من أصل ألماني حكمت روسيا من ١٧٦٢ إلى ١٧٩٦؟', 'Catherine the Great', 'كاترين العظيمة', { s: 'modern', r: 'Catherine the Great' }],
]);
M('mythology', [
  ['e21', 200, 'Who is the Greek god of the sea?', 'من إله البحر عند الإغريق؟', 'Poseidon', 'بوسيدون', { s: 'greek', r: 'Poseidon' }],
  ['h21', 400, 'Which Greek messenger god wore winged sandals?', 'أي إله رسول عند الإغريق كان ينتعل صندلاً مجنّحاً؟', 'Hermes', 'هيرميس', { s: 'greek', x: 1, r: 'Hermes' }],
  ['x21', 600, 'In Norse myth, which giant wolf kills Odin at Ragnarök?', 'في الأساطير الإسكندنافية، أي ذئب عملاق يقتل أودين في «راغناروك»؟', 'Fenrir', 'فنرير', { s: 'norse', r: 'Fenrir' }],
]);
M('space', [
  ['e21', 200, 'What is the name of our galaxy?', 'ما اسم مجرتنا؟', 'The Milky Way', 'درب التبانة', { s: 'stars', r: 'Milky Way' }],
  ['h21', 400, 'Which former planet was reclassified as a dwarf planet in 2006?', 'أي كوكب سابق أُعيد تصنيفه كوكباً قزماً عام ٢٠٠٦؟', 'Pluto', 'بلوتو', { s: 'planets', x: 1, r: 'Pluto' }],
  ['x21', 600, 'Which moon of Jupiter is the largest moon in the Solar System?', 'أي قمر من أقمار المشتري هو أكبر قمر في المجموعة الشمسية؟', 'Ganymede', 'غانيميد', { s: 'planets', r: 'Ganymede (moon)' }],
]);
M('physics-chem', [
  ['e21', 200, 'What is the common name for H₂O?', 'ما الاسم الشائع للمركب H₂O؟', 'Water', 'الماء', { s: 'elements', r: 'Water' }],
  ['h21', 400, 'What is the chemical symbol for sodium?', 'ما الرمز الكيميائي للصوديوم؟', 'Na', 'Na', { s: 'elements', x: 1, n: 'From the Latin natrium.', nAr: 'من الكلمة اللاتينية Natrium.', r: 'Sodium' }],
  ['x21', 600, 'Who discovered radioactivity, in 1896?', 'من اكتشف النشاط الإشعاعي عام ١٨٩٦؟', 'Henri Becquerel', 'هنري بيكريل', { s: 'scientists', r: 'Henri Becquerel' }],
]);
M('body', [
  ['e21', 200, 'How many lungs does a person normally have?', 'كم رئة لدى الإنسان عادةً؟', 'Two', 'اثنتان', { s: 'organs', alt: ['2'], r: 'Lung' }],
  ['h21', 400, 'What is the tube that carries food from the throat to the stomach called?', 'ما اسم الأنبوب الذي ينقل الطعام من الحلق إلى المعدة؟', 'The oesophagus', 'المريء', { s: 'organs', x: 1, alt: ['esophagus', 'gullet'], r: 'Esophagus' }],
  ['x21', 600, 'What is the hardest substance in the human body?', 'ما أصلب مادة في جسم الإنسان؟', 'Tooth enamel', 'مينا الأسنان', { s: 'skeleton', r: 'Tooth enamel' }],
]);
M('biology', [
  ['e21', 200, 'What do herbivores eat?', 'ماذا تأكل الحيوانات العاشبة؟', 'Plants', 'النباتات', { s: 'life', r: 'Herbivore' }],
  ['h21', 400, 'Which English doctor created the first vaccine, against smallpox, in 1796?', 'أي طبيب إنجليزي صنع أول لقاح، ضد الجدري، عام ١٧٩٦؟', 'Edward Jenner', 'إدوارد جينر', { s: 'life', x: 1, r: 'Edward Jenner' }],
  ['x21', 600, 'Which type of RNA carries amino acids to the ribosome?', 'أي نوع من الحمض الريبي ينقل الأحماض الأمينية إلى الريبوسوم؟', 'Transfer RNA (tRNA)', 'الحمض الريبي الناقل (tRNA)', { s: 'genetics', x: 1, r: 'Transfer RNA' }],
]);
M('maths', [
  ['e21', 200, 'What is 9 squared?', 'كم يساوي ٩ تربيع؟', '81', '٨١', { s: 'arithmetic', r: 'Square number' }],
  ['h21', 400, 'Which Roman numeral stands for 50?', 'أي رقم روماني يمثّل العدد ٥٠؟', 'L', 'L', { s: 'famous', x: 1, r: 'Roman numerals' }],
  ['x21', 600, 'How many edges does a cube have?', 'كم حرفاً (ضلعاً) للمكعب؟', '12', '١٢', { s: 'geometry', r: 'Cube' }],
]);
M('computing', [
  ['e21', 200, 'Which keyboard key do you hold to type a capital letter?', 'أي مفتاح في لوحة المفاتيح تضغطه لكتابة حرف كبير؟', 'Shift', 'شِفت (Shift)', { s: 'basics', r: 'Shift key' }],
  ['h21', 400, 'What does PDF stand for?', 'ماذا يعني اختصار PDF؟', 'Portable Document Format', 'تنسيق المستندات المحمولة', { s: 'basics', x: 1, r: 'PDF' }],
  ['x21', 600, 'Which company originally created the Java programming language?', 'أي شركة ابتكرت لغة البرمجة جافا في الأصل؟', 'Sun Microsystems', 'صن مايكروسيستمز', { s: 'history', r: 'Java (programming language)' }],
]);
M('tech', [
  ['e21', 200, 'Which streaming company started out by mailing DVDs to customers?', 'أي شركة بث بدأت بإرسال أقراص DVD للعملاء بالبريد؟', 'Netflix', 'نتفليكس', { s: 'companies', r: 'Netflix' }],
  ['h21', 400, 'Which Chinese company makes the Mi and Redmi phones?', 'أي شركة صينية تصنع هواتف «مي» و«ريدمي»؟', 'Xiaomi', 'شاومي', { s: 'gadgets', x: 1, r: 'Xiaomi' }],
  ['x21', 600, 'Who co-founded Google with Larry Page?', 'من أسس غوغل مع لاري بيج؟', 'Sergey Brin', 'سيرغي برين', { s: 'founders', r: 'Sergey Brin' }],
]);
M('mammals', [
  ['e21', 200, 'What is a baby cat called?', 'ماذا يُسمّى صغير القط؟', 'A kitten', 'هُريرة (قطيطة)', { s: 'wild', r: 'Kitten' }],
  ['h21', 400, 'What is the largest rodent in the world?', 'ما أكبر القوارض في العالم؟', 'The capybara', 'الكابيبارا', { s: 'records', x: 1, r: 'Capybara' }],
  ['x21', 600, 'What is a baby echidna called?', 'ماذا يُسمّى صغير آكل النمل الشوكي (الإكيدنا)؟', 'A puggle', 'باغل (Puggle)', { s: 'wild', x: 1, r: 'Echidna' }],
]);
M('ocean', [
  ['e21', 200, 'What is a baby whale called?', 'ماذا يُسمّى صغير الحوت؟', 'A calf', 'عجل', { s: 'creatures', r: 'Whale' }],
  ['h21', 400, 'Which is the smallest of the world’s oceans?', 'ما أصغر محيطات العالم؟', 'The Arctic Ocean', 'المحيط المتجمد الشمالي', { s: 'reefs', x: 1, r: 'Arctic Ocean' }],
  ['x21', 600, 'What nickname is given to the pitch-dark ocean layer from about 1,000 to 4,000 metres deep?', 'ما الاسم الذي يُطلق على طبقة المحيط المظلمة تماماً من نحو ١٠٠٠ إلى ٤٠٠٠ متر عمقاً؟', 'The midnight zone (bathypelagic zone)', 'منطقة منتصف الليل (النطاق الباثي)', { s: 'reefs', x: 1, r: 'Bathyal zone' }],
]);
M('birds-reptiles', [
  ['e21', 200, 'Which bird fans out a huge colourful tail to show off?', 'أي طائر يفرد ذيلاً ملوناً ضخماً للتباهي؟', 'The peacock', 'الطاووس', { s: 'birds', r: 'Peafowl' }],
  ['h21', 400, 'Which bird is famous for laying its eggs in other birds’ nests?', 'أي طائر يشتهر بوضع بيضه في أعشاش طيور أخرى؟', 'The cuckoo', 'الوقواق', { s: 'birds', x: 1, r: 'Common cuckoo' }],
  ['x21', 600, 'What is a group of owls traditionally called?', 'ماذا تُسمّى مجموعة البوم تقليدياً بالإنجليزية؟', 'A parliament', 'Parliament («برلمان»)', { s: 'birds', x: 1, r: 'List of English terms of venery, by animal' }],
]);
M('prehistoric', [
  ['e21', 200, 'Which 1993 film brought dinosaurs back to life using DNA from amber?', 'أي فيلم عام ١٩٩٣ أعاد الديناصورات إلى الحياة باستخدام حمض نووي من الكهرمان؟', 'Jurassic Park', 'الحديقة الجوراسية', { s: 'dinos', f: 'jp', r: 'Jurassic Park' }],
  ['h21', 400, 'What does the word "dinosaur" mean?', 'ماذا تعني كلمة «ديناصور»؟', 'Terrible lizard', 'السحلية المرعبة', { s: 'science', x: 1, r: 'Dinosaur' }],
  ['x21', 600, 'Which dinosaur had claws up to about a metre long, the longest of any known animal?', 'أي ديناصور كانت مخالبه تصل إلى نحو متر، الأطول بين الحيوانات المعروفة؟', 'Therizinosaurus', 'ثيريزينوصور', { s: 'dinos', x: 1, r: 'Therizinosaurus' }],
]);
M('plants-bugs', [
  ['e21', 200, 'Which gas do plants give off during photosynthesis?', 'أي غاز تطلقه النباتات أثناء البناء الضوئي؟', 'Oxygen', 'الأكسجين', { s: 'plants', r: 'Photosynthesis' }],
  ['h21', 400, 'How many legs does a spider have?', 'كم رِجلاً للعنكبوت؟', 'Eight', 'ثمانٍ', { s: 'insects', x: 1, alt: ['8'], r: 'Spider' }],
  ['x21', 600, 'Bamboo belongs to which plant family?', 'إلى أي فصيلة نباتية ينتمي الخيزران (البامبو)؟', 'The grass family (Poaceae)', 'الفصيلة النجيلية (الأعشاب)', { s: 'plants', x: 1, r: 'Bamboo' }],
]);
M('world-food', [
  ['e21', 200, 'Pad thai is a famous noodle dish from which country?', 'باد تاي طبق نودلز شهير من أي بلد؟', 'Thailand', 'تايلاند', { s: 'asia', r: 'Pad thai' }],
  ['h21', 400, 'What is Spain’s famous cold tomato soup called?', 'ما اسم حساء الطماطم البارد الشهير في إسبانيا؟', 'Gazpacho', 'غاسباتشو', { s: 'europe', x: 1, r: 'Gazpacho' }],
  ['x21', 600, 'What is the Japanese name for the savoury "fifth taste"?', 'ما الاسم الياباني لـ«الطعم الخامس» المالح اللذيذ؟', 'Umami', 'أومامي', { s: 'asia', r: 'Umami' }],
]);
M('arab-food', [
  ['e21', 200, 'What is the Levantine flatbread topped with za’atar and olive oil called?', 'ما اسم الخبز الشامي المسطح المغطى بالزعتر وزيت الزيتون؟', 'Manakish', 'المناقيش', { s: 'levant', alt: ['Man\'oushe'], r: 'Manakish' }],
]);
M('fast-food', [
  ['e21', 200, 'Which Canadian coffee-and-doughnut chain is famous for Timbits?', 'أي سلسلة كندية للقهوة والدونات تشتهر بـ«تيمبتس»؟', 'Tim Hortons', 'تيم هورتنز', { s: 'chains', r: 'Tim Hortons' }],
  ['h21', 400, 'Which company owns the Oreo cookie brand?', 'أي شركة تملك علامة بسكويت أوريو؟', 'Mondelēz International', 'موندليز إنترناشونال', { s: 'snacks', x: 1, alt: ['Nabisco'], r: 'Oreo' }],
  ['x21', 600, 'In which US city did the first Pizza Hut open, in 1958?', 'في أي مدينة أمريكية افتُتح أول مطعم بيتزا هت عام ١٩٥٨؟', 'Wichita, Kansas', 'ويتشيتا، كانساس', { s: 'chains', x: 1, r: 'Pizza Hut' }],
]);
M('drinks', [
  ['e21', 200, 'Which orange fizzy drink brand is owned by Coca-Cola?', 'أي علامة مشروب غازي بالبرتقال تملكها كوكا كولا؟', 'Fanta', 'فانتا', { s: 'soft', r: 'Fanta' }],
  ['h21', 400, 'Yerba mate, drunk from a gourd through a metal straw, is the national drink of which country?', 'شاي «المتة» الذي يُشرب من قرعة بماصة معدنية هو المشروب الوطني لأي دولة؟', 'Argentina', 'الأرجنتين', { s: 'tea', x: 1, alt: ['Uruguay', 'Paraguay'], r: 'Mate (drink)' }],
  ['x21', 600, 'Red Bull was adapted from Krating Daeng, an energy drink from which country?', 'رد بول مأخوذ من «كراتينغ داينغ»، مشروب طاقة من أي بلد؟', 'Thailand', 'تايلاند', { s: 'soft', r: 'Krating Daeng' }],
]);
M('cars', [
  ['e21', 200, 'Which country is Ferrari from?', 'من أي بلد شركة فيراري؟', 'Italy', 'إيطاليا', { s: 'brands', r: 'Ferrari' }],
  ['h21', 400, 'Which Japanese brand makes the Civic and the Accord?', 'أي علامة يابانية تصنع سيفيك وأكورد؟', 'Honda', 'هوندا', { s: 'models', x: 1, r: 'Honda Civic' }],
  ['x21', 600, 'Which carmaker introduced the modern three-point seatbelt, invented by Nils Bohlin, in 1959?', 'أي شركة سيارات قدّمت حزام الأمان الحديث ثلاثي النقاط من اختراع نيلز بولين عام ١٩٥٩؟', 'Volvo', 'فولفو', { s: 'history', r: 'Nils Bohlin' }],
]);
M('fashion', [
  ['e21', 200, 'Which sportswear brand’s logo is a leaping big cat?', 'أي علامة رياضية شعارها قط كبير يقفز؟', 'Puma', 'بوما', { s: 'sport', r: 'Puma (brand)' }],
  ['h21', 400, 'Which Milan fashion house, run for decades by Miuccia, was founded by her grandfather Mario?', 'أي دار أزياء في ميلانو أدارتها ميوتشا لعقود وأسسها جدها ماريو؟', 'Prada', 'برادا', { s: 'luxury', x: 1, r: 'Prada' }],
  ['x21', 600, 'Which designer popularised the "little black dress" in the 1920s?', 'أي مصممة نشرت «الفستان الأسود القصير» في عشرينيات القرن الماضي؟', 'Coco Chanel', 'كوكو شانيل', { s: 'luxury', ok: 1, r: 'Little black dress' }],
]);
M('business', [
  ['e21', 200, 'What is the currency of the United States?', 'ما عملة الولايات المتحدة؟', 'The US dollar', 'الدولار الأمريكي', { s: 'money', r: 'United States dollar' }],
  ['h21', 400, 'What is the maximum number of bitcoins that can ever exist?', 'ما الحد الأقصى لعدد البيتكوين الذي يمكن أن يوجد؟', '21 million', '٢١ مليوناً', { s: 'money', x: 1, f: 'bitcoin', r: 'Bitcoin' }],
  ['x21', 600, 'What is the name used by the anonymous creator of Bitcoin?', 'ما الاسم الذي يستخدمه المبتكر المجهول للبيتكوين؟', 'Satoshi Nakamoto', 'ساتوشي ناكاموتو', { s: 'money', f: 'bitcoin', r: 'Satoshi Nakamoto' }],
]);
M('traditions', [
  ['e21', 200, 'Which country celebrates Thanksgiving on the fourth Thursday of November?', 'أي دولة تحتفل بعيد الشكر في الخميس الرابع من نوفمبر؟', 'The United States', 'الولايات المتحدة', { s: 'world', f: 'thanks', r: 'Thanksgiving (United States)' }],
  ['h21', 400, 'Which Chinese festival is also called the Spring Festival?', 'أي عيد صيني يُسمّى أيضاً عيد الربيع؟', 'Chinese (Lunar) New Year', 'رأس السنة الصينية (القمرية)', { s: 'world', x: 1, r: 'Chinese New Year' }],
  ['x21', 600, 'In which month is Thanksgiving celebrated in Canada?', 'في أي شهر يُحتفل بعيد الشكر في كندا؟', 'October', 'أكتوبر', { s: 'world', f: 'thanks', r: 'Thanksgiving (Canada)' }],
]);
M('arabic-lang', [
  ['e21', 200, 'What does the Arabic word «شكراً» (shukran) mean?', 'ماذا تعني كلمة «شكراً» بالإنجليزية؟', 'Thank you', 'Thank you', { s: 'words', r: 'Arabic' }],
  ['h21', 400, 'What is the Arabic word for "book"?', 'ما الكلمة الإنجليزية لـ«كتاب»؟', 'كتاب (kitāb)', 'Book', { s: 'words', x: 1, ok: 1, r: 'Arabic' }],
]);
M('english-words', [
  ['e21', 200, 'What is the past tense of "eat"?', 'ما صيغة الماضي من الفعل «eat»؟', 'Ate', 'Ate', { s: 'grammar', r: 'English irregular verbs' }],
  ['h21', 400, 'What do you call words that sound the same but differ in meaning, like "flower" and "flour"?', 'ماذا تُسمّى الكلمات التي تُنطق بالطريقة نفسها وتختلف في المعنى، مثل «flower» و«flour»؟', 'Homophones', 'كلمات متجانسة لفظاً (Homophones)', { s: 'grammar', x: 1, r: 'Homophone' }],
  ['x21', 600, 'Which word is the most frequently used in written English?', 'ما الكلمة الأكثر استخداماً في الإنجليزية المكتوبة؟', '"The"', '«The»', { s: 'grammar', x: 1, r: 'Most common words in English' }],
]);
