/* New topics (owner feedback, Oct 2026): WWE, football career paths, brand slogans,
   "Which came first?", and guess-the-country from emoji. Facts are history, not current
   standings, so nothing here should go out of date. */
(function () {
  var emo = function (e) { return { type: 'image', emoji: e, alt: ['An emoji puzzle', 'لغز إيموجي'] }; };

  /* ---------------- WWE & Pro Wrestling ---------------- */
  KH_BANK.cat('wwe', { g: 'sports', e: '🤼', en: 'WWE & Pro Wrestling', ar: 'WWE والمصارعة الحرة', pop: 1,
    subs: { legends: ['Wrestlers & nicknames', 'مصارعون وألقاب'], moves: ['Moves & catchphrases', 'حركات وعبارات'], history: ['Shows & history', 'عروض وتاريخ'] } }, [
    ['e01', 200, 'Which wrestler-turned-Hollywood star was nicknamed "The People’s Champion"?', 'أي مصارع صار نجم هوليوود ولقبه «بطل الشعب»؟', 'The Rock (Dwayne Johnson)', 'ذا روك (دواين جونسون)', { s: 'legends', alt: ['The Rock', 'Dwayne Johnson'], altAr: ['ذا روك'] }],
    ['e02', 200, 'Which wrestler’s catchphrase is "You can’t see me"?', 'أي مصارع عبارته المشهورة «You can’t see me»؟', 'John Cena', 'جون سينا', { s: 'moves' }],
    ['e03', 200, 'Which wrestler is known as "The Deadman"?', 'أي مصارع يُلقّب بـ«الرجل الميت»؟', 'The Undertaker', 'أندرتيكر', { s: 'legends', f: 'undertaker', alt: ['Undertaker'] }],
    ['e04', 200, 'What is Stone Cold Steve Austin’s famous finishing move called?', 'ما اسم الحركة الختامية المشهورة لستون كولد ستيف أوستن؟', 'The Stone Cold Stunner', 'ستون كولد ستانر', { s: 'moves', alt: ['Stunner'], ok: 1 }],
    ['e05', 200, 'What does WWE stand for?', 'وش يعني اختصار WWE؟', 'World Wrestling Entertainment', 'World Wrestling Entertainment (الترفيه العالمي للمصارعة)', { s: 'history', f: 'wwe-name' }],
    ['e06', 200, 'Which wrestler was nicknamed "The Heartbreak Kid"?', 'أي مصارع لقبه «ذا هارتبريك كيد»؟', 'Shawn Michaels', 'شون مايكلز', { s: 'legends', f: 'hbk', alt: ['HBK'] }],
    ['e07', 200, 'In a Royal Rumble match, how is a wrestler eliminated?', 'في نزال «رويال رامبل»، كيف يُقصى المصارع؟', 'Thrown over the top rope, with both feet touching the floor', 'يُرمى من فوق الحبل العلوي ويلمس الأرض بقدميه الاثنتين', { s: 'history', alt: ['Over the top rope'] }],
    ['e08', 200, 'What is the masked style of Mexican wrestling called?', 'ما اسم أسلوب المصارعة المكسيكية بالأقنعة؟', 'Lucha libre', 'لوتشا ليبري', { s: 'history' }],
    ['e09', 200, 'What were Hulk Hogan’s fans called?', 'وش كان اسم جمهور هالك هوجن؟', 'Hulkamaniacs', 'هالكامانياكس (هالكامانيا)', { s: 'legends', alt: ['Hulkamania'] }],
    ['e10', 200, 'Wrestlers often grab which metal object from under the ring to use as a weapon?', 'المصارعون كثير ياخذون أي شي معدني من تحت الحلبة ويستخدمونه سلاح؟', 'A steel chair', 'كرسي حديد', { s: 'moves', alt: ['Chair'], altAr: ['كرسي'] }],
    ['h01', 400, 'Which family has owned and run WWE for most of its history?', 'أي عائلة امتلكت وأدارت WWE أغلب تاريخها؟', 'The McMahon family', 'عائلة ماكمان', { s: 'history', alt: ['McMahon', 'McMahons'], r: 'WWE' }],
    ['h02', 400, 'Which wrestler’s finishing move is the "RKO"?', 'أي مصارع حركته الختامية «RKO»؟', 'Randy Orton', 'راندي أورتن', { s: 'moves', r: 'Randy Orton' }],
    ['h03', 400, 'Which wrestler is known as "The Phenomenal One"?', 'أي مصارع يُلقّب بـ«ذا فينومينال ون»؟', 'AJ Styles', 'إيه جيه ستايلز', { s: 'legends', r: 'AJ Styles' }],
    ['h04', 400, 'In which famous New York arena was the first WrestleMania held, in 1985?', 'في أي ساحة مشهورة في نيويورك أقيم أول رسلمانيا عام ١٩٨٥؟', 'Madison Square Garden', 'ماديسون سكوير غاردن', { s: 'history', f: 'wrestlemania', alt: ['MSG'], r: 'WrestleMania I' }],
    ['h05', 400, 'What is WWE’s long-running Monday night show called?', 'ما اسم عرض WWE الأسبوعي القديم ليلة الاثنين؟', 'Raw (Monday Night Raw)', 'رو (Raw)', { s: 'history', alt: ['Raw', 'Monday Night Raw'], r: 'WWE Raw' }],
    ['h06', 400, 'What is WWE’s Friday night show called?', 'ما اسم عرض WWE ليلة الجمعة؟', 'SmackDown', 'سماك داون', { s: 'history', r: 'WWE SmackDown' }],
    ['h07', 400, 'Which wrestler is nicknamed "The Beast Incarnate"?', 'أي مصارع لقبه «الوحش المتجسد»؟', 'Brock Lesnar', 'بروك ليسنر', { s: 'legends', f: 'streak', r: 'Brock Lesnar' }],
    ['h08', 400, 'Which wrestler is "The Nature Boy", famous for shouting "Wooo!"?', 'أي مصارع لقبه «ذا نيتشر بوي» ومشهور بصرخة «ووو!»؟', 'Ric Flair', 'ريك فلير', { s: 'legends', f: 'flair', r: 'Ric Flair' }],
    ['h09', 400, 'What is the match fought inside a roofed steel structure around the ring called?', 'وش اسم النزال اللي يصير داخل قفص حديد مسقوف حول الحلبة؟', 'Hell in a Cell', 'هيل إن ذا سيل (Hell in a Cell)', { s: 'moves', r: 'Hell in a Cell' }],
    ['h10', 400, 'What is the wrestling word for presenting staged storylines as if they were real?', 'وش الكلمة في المصارعة اللي تعني تقديم القصص المرتّبة كأنها حقيقية؟', 'Kayfabe', 'كايفيب', { s: 'history', r: 'Kayfabe' }],
    ['h11', 400, 'Which WWE women’s champion is Ric Flair’s daughter?', 'أي بطلة في WWE بنت ريك فلير؟', 'Charlotte Flair', 'شارلوت فلير', { s: 'legends', f: 'flair', r: 'Charlotte Flair' }],
    ['h12', 400, 'What is the name of WWE’s brand for developing new wrestlers?', 'ما اسم علامة WWE لتطوير المصارعين الجدد؟', 'NXT', 'إن إكس تي (NXT)', { s: 'history', r: 'WWE NXT' }],
    ['x01', 600, 'What was The Undertaker’s WrestleMania record when his streak ended in 2014?', 'كم كان سجل أندرتيكر في رسلمانيا لما انكسرت سلسلته عام ٢٠١٤؟', '21–1', '٢١ فوز مقابل خسارة', { s: 'history', f: ['streak', 'undertaker'], alt: ['21-1', '21 wins 1 loss'], r: 'The Streak (professional wrestling)' }],
    ['x02', 600, 'Who won the very first Royal Rumble match, in 1988?', 'من فاز بأول نزال «رويال رامبل» عام ١٩٨٨؟', '"Hacksaw" Jim Duggan', 'جيم داغن «هاكسو»', { s: 'history', x: 1, alt: ['Jim Duggan', 'Hacksaw'], r: 'Royal Rumble (1988)' }],
    ['x03', 600, 'Which rival wrestling company did the WWF buy in 2001?', 'أي شركة مصارعة منافسة اشترتها WWF عام ٢٠٠١؟', 'WCW (World Championship Wrestling)', 'WCW (المصارعة العالمية للبطولات)', { s: 'history', f: 'wcw', alt: ['WCW', 'World Championship Wrestling'], r: 'World Championship Wrestling' }],
    ['x04', 600, 'In the "Monday Night Wars", what was the rival show to Raw called?', 'في «حروب ليلة الاثنين»، وش كان اسم العرض المنافس لـRaw؟', 'WCW Monday Nitro', 'نايترو (WCW Monday Nitro)', { s: 'history', f: 'wcw', alt: ['Nitro', 'Monday Nitro'], r: 'WCW Monday Nitro' }],
    ['x05', 600, 'In which year did the WWF change its name to WWE?', 'في أي سنة غيّرت WWF اسمها إلى WWE؟', '2002', '٢٠٠٢', { s: 'history', f: 'wwe-name', r: 'WWE' }],
    ['x06', 600, 'Which wrestler’s real name is Terry Bollea?', 'أي مصارع اسمه الحقيقي تيري بوليا؟', 'Hulk Hogan', 'هالك هوجن', { s: 'legends', r: 'Hulk Hogan' }],
    ['x07', 600, 'André the Giant was born in which country?', 'أندريه العملاق انولد في أي دولة؟', 'France', 'فرنسا', { s: 'legends', f: 'andre', r: 'André the Giant' }],
    ['x08', 600, 'Which wrestler was known as "The Rated-R Superstar"?', 'أي مصارع لقبه «النجم المصنّف R»؟', 'Edge', 'إيدج', { s: 'legends', x: 1, r: 'Edge (wrestler)' }],
    ['x09', 600, 'What was Eddie Guerrero’s famous finishing move?', 'وش كانت الحركة الختامية المشهورة لإدي غيريرو؟', 'The Frog Splash', 'فروغ سبلاش (Frog Splash)', { s: 'moves', x: 1, alt: ['Five Star Frog Splash'], r: 'Eddie Guerrero' }],
    ['x10', 600, 'The 1997 "Montreal Screwjob" involved Bret Hart and which opponent?', 'حادثة «مونتريال سكروجوب» عام ١٩٩٧ كانت بين بريت هارت وأي خصم؟', 'Shawn Michaels', 'شون مايكلز', { s: 'history', f: 'hbk', x: 1, ok: 1, r: 'Montreal Screwjob' }],
  ]);

  /* ---------------- Football career paths ---------------- */
  var CP = ['Whose career path is this?', 'مسيرة أي لاعب هذي؟'];
  var rows = [
    ['e01', 200, 'Sporting CP → Manchester United → Real Madrid → Juventus → Manchester United → Al Nassr', 'سبورتينغ → مانشستر يونايتد → ريال مدريد → يوفنتوس → مانشستر يونايتد → النصر', 'Cristiano Ronaldo', 'كريستيانو رونالدو', { f: 'cr7-path' }],
    ['e02', 200, 'Barcelona → Paris Saint-Germain → Inter Miami', 'برشلونة → باريس سان جيرمان → إنتر ميامي', 'Lionel Messi', 'ليونيل ميسي', {}],
    ['e03', 200, 'Santos → Barcelona → Paris Saint-Germain → Al Hilal → Santos', 'سانتوس → برشلونة → باريس سان جيرمان → الهلال → سانتوس', 'Neymar', 'نيمار', {}],
    ['e04', 200, 'Monaco → Paris Saint-Germain → Real Madrid', 'موناكو → باريس سان جيرمان → ريال مدريد', 'Kylian Mbappé', 'كيليان مبابي', { alt: ['Mbappe'] }],
    ['e05', 200, 'Al Mokawloon → Basel → Chelsea → Fiorentina → Roma → Liverpool', 'المقاولون العرب → بازل → تشيلسي → فيورنتينا → روما → ليفربول', 'Mohamed Salah', 'محمد صلاح', { alt: ['Salah'] }],
    ['e06', 200, 'Bryne → Molde → RB Salzburg → Borussia Dortmund → Manchester City', 'براين → مولده → سالزبورغ → بوروسيا دورتموند → مانشستر سيتي', 'Erling Haaland', 'إيرلينغ هالاند', { alt: ['Haaland'] }],
    ['e07', 200, 'Tottenham (with loans to Leyton Orient, Millwall, Norwich and Leicester) → Bayern Munich', 'توتنهام (مع إعارات لليتون أورينت وميلوول ونوريتش وليستر) → بايرن ميونخ', 'Harry Kane', 'هاري كين', {}],
    ['e08', 200, 'Genk → Chelsea → Wolfsburg → Manchester City → Napoli', 'غنك → تشيلسي → فولفسبورغ → مانشستر سيتي → نابولي', 'Kevin De Bruyne', 'كيفن دي بروين', { alt: ['De Bruyne'] }],
    ['h01', 400, 'Boulogne → Caen → Leicester City → Chelsea → Al-Ittihad', 'بولوني → كان → ليستر سيتي → تشيلسي → الاتحاد', 'N’Golo Kanté', 'نغولو كانتي', { alt: ['Kante', 'Kanté'] }],
    ['h02', 400, 'Le Havre → Leicester City → Manchester City → Al-Ahli', 'لوهافر → ليستر سيتي → مانشستر سيتي → الأهلي', 'Riyad Mahrez', 'رياض محرز', { alt: ['Mahrez'] }],
    ['h03', 400, 'Cannes → Bordeaux → Juventus → Real Madrid (as a player)', 'كان → بوردو → يوفنتوس → ريال مدريد (كلاعب)', 'Zinedine Zidane', 'زين الدين زيدان', { alt: ['Zidane'] }],
    ['h04', 400, 'Monaco → Juventus → Arsenal → Barcelona → New York Red Bulls', 'موناكو → يوفنتوس → آرسنال → برشلونة → نيويورك ريد بولز', 'Thierry Henry', 'تييري هنري', { alt: ['Henry'] }],
    ['h05', 400, 'Malmö → Ajax → Juventus → Inter → Barcelona → AC Milan → PSG → Manchester United → LA Galaxy → AC Milan', 'مالمو → أياكس → يوفنتوس → إنتر → برشلونة → ميلان → باريس سان جيرمان → مانشستر يونايتد → لوس أنجلوس غالاكسي → ميلان', 'Zlatan Ibrahimović', 'زلاتان إبراهيموفيتش', { alt: ['Zlatan', 'Ibrahimovic'] }],
    ['h06', 400, 'Lyon → Real Madrid → Al-Ittihad', 'ليون → ريال مدريد → الاتحاد', 'Karim Benzema', 'كريم بنزيما', { alt: ['Benzema'] }],
    ['h07', 400, 'Metz → RB Salzburg → Southampton → Liverpool → Bayern Munich → Al Nassr', 'ميتز → سالزبورغ → ساوثهامبتون → ليفربول → بايرن ميونخ → النصر', 'Sadio Mané', 'ساديو ماني', { alt: ['Mane'] }],
    ['h08', 400, 'Den Bosch → Heerenveen → PSV → Manchester United → Real Madrid → Hamburg → Málaga', 'دن بوش → هيرنفين → آيندهوفن → مانشستر يونايتد → ريال مدريد → هامبورغ → ملقا', 'Ruud van Nistelrooy', 'رود فان نيستلروي', { alt: ['Van Nistelrooy'] }],
    ['h09', 400, 'Hamburg → Bayer Leverkusen → Tottenham → Los Angeles FC', 'هامبورغ → باير ليفركوزن → توتنهام → لوس أنجلوس إف سي', 'Son Heung-min', 'سون هيونغ مين', { alt: ['Son', 'Heung-min Son'] }],
    ['x01', 600, 'Dinamo Zagreb → Tottenham → Real Madrid → AC Milan', 'دينامو زغرب → توتنهام → ريال مدريد → ميلان', 'Luka Modrić', 'لوكا مودريتش', { alt: ['Modric'] }],
    ['x02', 600, 'Atlético Madrid → Liverpool → Chelsea → AC Milan → Atlético Madrid → Sagan Tosu', 'أتلتيكو مدريد → ليفربول → تشيلسي → ميلان → أتلتيكو مدريد → ساغان توسو', 'Fernando Torres', 'فرناندو توريس', { alt: ['Torres'] }],
    ['x03', 600, 'Schalke → Werder Bremen → Real Madrid → Arsenal → Fenerbahçe → İstanbul Başakşehir', 'شالكه → فيردر بريمن → ريال مدريد → آرسنال → فنربخشة → إسطنبول باشاك شهير', 'Mesut Özil', 'مسعود أوزيل', { alt: ['Ozil'] }],
    ['x04', 600, 'Cruzeiro → PSV → Barcelona → Inter → Real Madrid → AC Milan → Corinthians', 'كروزيرو → آيندهوفن → برشلونة → إنتر → ريال مدريد → ميلان → كورينثيانز', 'Ronaldo (Ronaldo Nazário)', 'رونالدو (رونالدو نازاريو)', { alt: ['R9', 'Ronaldo Nazario'], altAr: ['الظاهرة'] }],
    ['x05', 600, 'Ajax → Tottenham → Inter → Brentford → Manchester United', 'أياكس → توتنهام → إنتر → برينتفورد → مانشستر يونايتد', 'Christian Eriksen', 'كريستيان إريكسن', { x: 1, alt: ['Eriksen'] }],
    ['x06', 600, 'Heerenveen → Twente → Ajax → Chelsea → Galatasaray', 'هيرنفين → تفينتي → أياكس → تشيلسي → غلطة سراي', 'Hakim Ziyech', 'حكيم زياش', { x: 1, alt: ['Ziyech'] }],
    ['x07', 600, 'Barcelona (his whole European career) → Al Sadd', 'برشلونة (كل مسيرته الأوروبية) → السد', 'Xavi (Xavi Hernández)', 'تشافي هيرنانديز', { alt: ['Xavi'] }],
    ['x08', 600, 'Al Hilal → Villarreal (on loan) → Al Hilal', 'الهلال → فياريال (إعارة) → الهلال', 'Salem Al-Dawsari', 'سالم الدوسري', { x: 1, alt: ['Al-Dawsari', 'Al Dawsari'] }],
  ];
  KH_BANK.cat('career-paths', { g: 'sports', e: '🧭', en: 'Football Career Paths', ar: 'مسيرة اللاعبين', pop: 1,
    subs: { stars: ['Current & recent stars', 'نجوم حاليون'], legends: ['Legends', 'أساطير'] } },
    rows.map(function (r) {
      var o = r[6]; o.s = /^(h03|h04|h08|x02|x03|x04|x07)$/.test(r[0]) ? 'legends' : 'stars';
      o.r = o.r || r[4].replace(/ \(.*\)$/, '');
      o.n = 'Main senior clubs in order (not every loan; the player may have moved since).'; o.nAr = 'أهم الأندية بالترتيب (مو كل الإعارات، ويمكن اللاعب انتقل بعدها).';
      return [r[0], r[1], 'Which player had this career: ' + r[2] + '?', 'أي لاعب كانت مسيرته: ' + r[3] + '؟', r[4], r[5], o];
    }));

  /* ---------------- Brand slogans ---------------- */
  var SQ = function (slogan) { return ['Which brand used the slogan "' + slogan + '"?', 'أي علامة تجارية استخدمت الشعار «' + slogan + '»؟']; };
  var sl = function (id, pts, slogan, en, ar, o) { var q = SQ(slogan); return [id, pts, q[0], q[1], en, ar, o || {}]; };
  KH_BANK.cat('slogans', { g: 'brands', e: '📣', en: 'Brand Slogans', ar: 'شعارات الماركات',
    subs: { food: ['Food & drink', 'أكل ومشروبات'], tech: ['Tech & cars', 'تقنية وسيارات'], style: ['Sport, style & more', 'رياضة وموضة وغيرها'] } }, [
    sl('e01', 200, 'Just Do It', 'Nike', 'نايكي', { s: 'style' }),
    sl('e02', 200, 'I’m Lovin’ It', 'McDonald’s', 'ماكدونالدز', { s: 'food' }),
    sl('e03', 200, 'Think Different', 'Apple', 'أبل', { s: 'tech' }),
    sl('e04', 200, 'Finger Lickin’ Good', 'KFC', 'كنتاكي (KFC)', { s: 'food', f: 'kfc' }),
    sl('e05', 200, 'Because You’re Worth It', 'L’Oréal', 'لوريال', { s: 'style' }),
    sl('e06', 200, 'Impossible Is Nothing', 'Adidas', 'أديداس', { s: 'style' }),
    sl('e07', 200, 'Have It Your Way', 'Burger King', 'برجر كنج', { s: 'food' }),
    sl('e08', 200, 'The Happiest Place on Earth', 'Disneyland', 'ديزني لاند', { s: 'style', alt: ['Disney'] }),
    sl('h01', 400, 'It Gives You Wings', 'Red Bull', 'ريد بول', { s: 'food', r: 'Red Bull' }),
    sl('h02', 400, 'The Ultimate Driving Machine', 'BMW', 'بي إم دبليو', { s: 'tech', r: 'BMW' }),
    sl('h03', 400, 'Melts in Your Mouth, Not in Your Hands', 'M&M’s', 'إم آند إمز', { s: 'food', r: 'M&M\'s' }),
    sl('h04', 400, 'Taste the Rainbow', 'Skittles', 'سكيتلز', { s: 'food', r: 'Skittles (confectionery)' }),
    sl('h05', 400, 'Every Little Helps', 'Tesco', 'تيسكو', { s: 'style', x: 1, r: 'Tesco' }),
    sl('h06', 400, 'Connecting People', 'Nokia', 'نوكيا', { s: 'tech', r: 'Nokia' }),
    sl('h07', 400, 'Eat Fresh', 'Subway', 'صب واي', { s: 'food', r: 'Subway (restaurant)' }),
    sl('h08', 400, 'Open Happiness', 'Coca-Cola', 'كوكا كولا', { s: 'food', r: 'Coca-Cola' }),
    sl('h09', 400, 'Snap! Crackle! Pop!', 'Rice Krispies (Kellogg’s)', 'رايس كريسبيز (كيلوغز)', { s: 'food', alt: ['Rice Krispies', 'Kellogg\'s'], r: 'Rice Krispies' }),
    sl('x01', 600, 'Vorsprung durch Technik', 'Audi', 'أودي', { s: 'tech', n: 'German for "Progress through technology".', nAr: 'بالألماني: «التقدّم بالتقنية».', r: 'Audi' }),
    sl('x02', 600, 'The Best a Man Can Get', 'Gillette', 'جيليت', { s: 'style', r: 'Gillette' }),
    sl('x03', 600, 'Don’t Leave Home Without It', 'American Express', 'أمريكان إكسبريس', { s: 'style', x: 1, alt: ['Amex'], r: 'American Express' }),
    sl('x04', 600, 'When It Absolutely, Positively Has to Be There Overnight', 'FedEx', 'فيديكس', { s: 'style', x: 1, r: 'FedEx' }),
    sl('x05', 600, 'A Diamond Is Forever', 'De Beers', 'دي بيرز', { s: 'style', r: 'A Diamond Is Forever' }),
    sl('x06', 600, 'Think Small', 'Volkswagen', 'فولكس فاغن', { s: 'tech', n: 'A famous 1959 advert for the Beetle.', nAr: 'إعلان مشهور عام ١٩٥٩ لسيارة الخنفساء.', r: 'Think Small' }),
    sl('x07', 600, 'Where Do You Want to Go Today?', 'Microsoft', 'مايكروسوفت', { s: 'tech', x: 1, r: 'Microsoft' }),
  ]);

  /* ---------------- Which came first? ---------------- */
  var WF = function (a, b, aAr, bAr) { return ['Which came first: ' + a + ' or ' + b + '?', 'مين جا أول: ' + aAr + ' ولا ' + bAr + '؟']; };
  var wf = function (id, pts, a, b, aAr, bAr, ansFirstIsA, extra) {
    var q = WF(a, b, aAr, bAr); var o = extra || {}; o.ok = 1;
    return [id, pts, q[0], q[1], ansFirstIsA ? a.replace(/^the /, 'The ') : b.replace(/^the /, 'The '), ansFirstIsA ? aAr : bAr, o];
  };
  KH_BANK.cat('which-first', { g: 'history', e: '⏳', en: 'Which Came First?', ar: 'مين جا أول؟',
    subs: { tech: ['Tech & games', 'تقنية وألعاب'], world: ['History & places', 'تاريخ وأماكن'], nature: ['Nature & science', 'طبيعة وعلوم'] } }, [
    wf('e01', 200, 'the first powered aeroplane flight', 'the sinking of the Titanic', 'أول رحلة طيران بمحرك', 'غرق تايتانيك', true, { s: 'world', n: '1903 vs 1912.', nAr: '١٩٠٣ مقابل ١٩١٢.' }),
    wf('e02', 200, 'YouTube', 'the iPhone', 'يوتيوب', 'الآيفون', true, { s: 'tech', n: '2005 vs 2007.', nAr: '٢٠٠٥ مقابل ٢٠٠٧.' }),
    wf('e03', 200, 'Facebook', 'Google', 'فيسبوك', 'قوقل', false, { s: 'tech', n: 'Google 1998, Facebook 2004.', nAr: 'قوقل ١٩٩٨، فيسبوك ٢٠٠٤.' }),
    wf('e04', 200, 'the Moon landing', 'the fall of the Berlin Wall', 'الهبوط على القمر', 'سقوط جدار برلين', true, { s: 'world', n: '1969 vs 1989.', nAr: '١٩٦٩ مقابل ١٩٨٩.' }),
    wf('e05', 200, 'Minecraft', 'Fortnite', 'ماينكرافت', 'فورتنايت', true, { s: 'tech', n: 'Minecraft 2009 (full release 2011), Fortnite 2017.', nAr: 'ماينكرافت ٢٠٠٩ (النسخة الكاملة ٢٠١١)، فورتنايت ٢٠١٧.' }),
    wf('e06', 200, 'the first PlayStation', 'the Nintendo 64', 'أول بلايستيشن', 'نينتندو ٦٤', true, { s: 'tech', n: '1994 vs 1996 (Japan).', nAr: '١٩٩٤ مقابل ١٩٩٦ (اليابان).' }),
    wf('e07', 200, 'the first Harry Potter book', 'the first Pokémon games', 'أول كتاب هاري بوتر', 'أول ألعاب بوكيمون', false, { s: 'tech', n: 'Pokémon 1996, Harry Potter 1997.', nAr: 'بوكيمون ١٩٩٦، هاري بوتر ١٩٩٧.' }),
    wf('e08', 200, 'Instagram', 'Snapchat', 'إنستغرام', 'سناب شات', true, { s: 'tech', n: '2010 vs 2011.', nAr: '٢٠١٠ مقابل ٢٠١١.' }),
    wf('e09', 200, 'Netflix', 'Google', 'نتفليكس', 'قوقل', true, { s: 'tech', n: 'Netflix 1997, Google 1998.', nAr: 'نتفليكس ١٩٩٧، قوقل ١٩٩٨.' }),
    wf('h01', 400, 'Coca-Cola', 'the Eiffel Tower', 'كوكا كولا', 'برج إيفل', true, { s: 'world', n: '1886 vs 1889.', nAr: '١٨٨٦ مقابل ١٨٨٩.', r: 'Coca-Cola' }),
    wf('h02', 400, 'Nintendo', 'the Ford Model T', 'نينتندو', 'سيارة فورد موديل T', true, { s: 'tech', n: 'Nintendo was founded in 1889 (making playing cards); the Model T came out in 1908.', nAr: 'نينتندو تأسست ١٨٨٩ (ورق لعب)، وموديل T طلعت ١٩٠٨.', r: 'Nintendo' }),
    wf('h03', 400, 'the University of al-Qarawiyyin', 'the University of Oxford', 'جامعة القرويين', 'جامعة أكسفورد', true, { s: 'world', n: 'Al-Qarawiyyin in Fez was founded in 859; teaching at Oxford dates from about 1096.', nAr: 'القرويين في فاس تأسست ٨٥٩م، والتدريس في أكسفورد بدأ تقريباً ١٠٩٦.', r: 'University of al-Qarawiyyin' }),
    wf('h04', 400, 'Tetris', 'the World Wide Web', 'تتريس', 'الشبكة العنكبوتية (الويب)', true, { s: 'tech', n: 'Tetris 1984; the web was proposed in 1989 and went public in 1991.', nAr: 'تتريس ١٩٨٤؛ الويب اقتُرح ١٩٨٩ وصار متاح ١٩٩١.', r: 'Tetris' }),
    wf('h05', 400, 'Wikipedia', 'euro coins and notes', 'ويكيبيديا', 'عملات اليورو النقدية', true, { s: 'tech', n: 'Wikipedia January 2001; euro cash January 2002.', nAr: 'ويكيبيديا يناير ٢٠٠١، ونقود اليورو يناير ٢٠٠٢.', r: 'Wikipedia' }),
    wf('h06', 400, 'Apple (the company)', 'the first Star Wars film', 'شركة أبل', 'أول فيلم حرب النجوم', true, { s: 'tech', n: 'Apple 1976, Star Wars 1977.', nAr: 'أبل ١٩٧٦، حرب النجوم ١٩٧٧.', r: 'Apple Inc.' }),
    wf('h07', 400, 'the first modern Olympic Games', 'the first Nobel Prizes', 'أول ألعاب أولمبية حديثة', 'أول جوائز نوبل', true, { s: 'world', n: '1896 vs 1901.', nAr: '١٨٩٦ مقابل ١٩٠١.', r: '1896 Summer Olympics' }),
    wf('h08', 400, 'the telephone', 'the fax machine', 'الهاتف', 'جهاز الفاكس', false, { s: 'tech', x: 1, n: 'Alexander Bain patented a fax idea in 1843; Bell’s telephone patent was 1876.', nAr: 'ألكسندر بين سجّل براءة فكرة الفاكس ١٨٤٣، وبراءة هاتف بيل كانت ١٨٧٦.', r: 'Fax' }),
    wf('x01', 600, 'the University of Oxford', 'the Aztec Empire', 'جامعة أكسفورد', 'إمبراطورية الأزتك', true, { s: 'world', n: 'Teaching at Oxford by about 1096; the Aztec Empire’s Triple Alliance formed in 1428.', nAr: 'التدريس في أكسفورد تقريباً ١٠٩٦، وتحالف الأزتك الثلاثي تكوّن ١٤٢٨.', r: 'Aztec Empire' }),
    wf('x02', 600, 'the lighter', 'the match', 'الولاعة', 'عود الكبريت', true, { s: 'nature', x: 1, n: 'Döbereiner’s lamp, an early lighter, 1823; the friction match, 1826.', nAr: 'مصباح دوبراينر (ولاعة قديمة) ١٨٢٣، وعود الكبريت بالاحتكاك ١٨٢٦.', r: 'Lighter' }),
    wf('x03', 600, 'the Great Pyramid of Giza', 'the extinction of the last woolly mammoths', 'الهرم الأكبر في الجيزة', 'انقراض آخر الماموث الصوفي', true, { s: 'nature', n: 'The pyramid was built around 2560 BC; the last mammoths, on Wrangel Island, died out around 2000 BC.', nAr: 'الهرم انبنى تقريباً ٢٥٦٠ ق.م، وآخر الماموث في جزيرة رانغل انقرض تقريباً ٢٠٠٠ ق.م.', r: 'Woolly mammoth' }),
    wf('x04', 600, 'sharks', 'trees', 'أسماك القرش', 'الأشجار', true, { s: 'nature', n: 'Sharks: over 400 million years ago; the first trees: about 385 million years ago.', nAr: 'القروش: قبل أكثر من ٤٠٠ مليون سنة؛ أول الأشجار: قبل حوالي ٣٨٥ مليون سنة.', r: 'Shark' }),
    wf('x05', 600, 'the Statue of Liberty', 'the Brooklyn Bridge', 'تمثال الحرية', 'جسر بروكلين', false, { s: 'world', n: 'Brooklyn Bridge opened 1883; the statue was dedicated in 1886.', nAr: 'جسر بروكلين افتتح ١٨٨٣، والتمثال دُشّن ١٨٨٦.', r: 'Brooklyn Bridge' }),
    wf('x06', 600, 'Velcro', 'the first satellite in space (Sputnik)', 'الفيلكرو', 'أول قمر صناعي (سبوتنيك)', true, { s: 'nature', x: 1, n: 'Velcro was patented in 1955; Sputnik launched in 1957.', nAr: 'الفيلكرو انسجلت براءته ١٩٥٥، وسبوتنيك انطلق ١٩٥٧.', r: 'Velcro' }),
    wf('x07', 600, 'the first email', 'the first mobile phone call', 'أول إيميل', 'أول مكالمة من جوال', true, { s: 'tech', n: 'The first network email was 1971; the first handheld mobile call was 1973.', nAr: 'أول إيميل عبر الشبكة ١٩٧١، وأول مكالمة من جوال محمول ١٩٧٣.', r: 'Email' }),
  ]);

  /* ---------------- Guess the country (emoji) ---------------- */
  var EC = ['Which country do these emoji describe?', 'أي دولة يوصفها هالإيموجي؟'];
  var ec = function (id, pts, e, en, ar, o) { o = o || {}; o.m = emo(e); return [id, pts, EC[0], EC[1], en, ar, o]; };
  KH_BANK.cat('emoji-countries', { g: 'geo', e: '🧩', en: 'Guess the Country (Emoji)', ar: 'خمّن الدولة (إيموجي)', pop: 1,
    subs: { easy: ['Famous clues', 'أدلة مشهورة'], hard: ['Tricky clues', 'أدلة صعبة'] } }, [
    ec('e01', 200, '🍁🏒❄️', 'Canada', 'كندا', { s: 'easy' }),
    ec('e02', 200, '🍕🍝🛵', 'Italy', 'إيطاليا', { s: 'easy' }),
    ec('e03', 200, '🗼🥐🧀', 'France', 'فرنسا', { s: 'easy' }),
    ec('e04', 200, '🦘🐨🏄', 'Australia', 'أستراليا', { s: 'easy' }),
    ec('e05', 200, '🗽🍔🦅', 'The United States', 'الولايات المتحدة', { s: 'easy', alt: ['USA', 'America'], altAr: ['أمريكا'] }),
    ec('e06', 200, '🐼🏯🥟', 'China', 'الصين', { s: 'easy' }),
    ec('e07', 200, '🌮🌵💀', 'Mexico', 'المكسيك', { s: 'easy', n: 'The skull is for the Day of the Dead.', nAr: 'الجمجمة رمز «يوم الموتى».' }),
    ec('e08', 200, '🍣🗻🌸', 'Japan', 'اليابان', { s: 'easy' }),
    ec('e09', 200, '🐫🔺🏺', 'Egypt', 'مصر', { s: 'easy' }),
    ec('h01', 400, '🧀🏔️⌚🍫', 'Switzerland', 'سويسرا', { s: 'easy', r: 'Switzerland' }),
    ec('h02', 400, '🌷🚲🧀', 'The Netherlands', 'هولندا', { s: 'easy', alt: ['Holland'], r: 'Netherlands' }),
    ec('h03', 400, '⚽🎭🏖️☕', 'Brazil', 'البرازيل', { s: 'easy', r: 'Brazil' }),
    ec('h04', 400, '🥝🐑🏉', 'New Zealand', 'نيوزيلندا', { s: 'easy', r: 'New Zealand' }),
    ec('h05', 400, '🐂💃🥘', 'Spain', 'إسبانيا', { s: 'easy', n: 'Paella 🥘 and flamenco 💃.', nAr: 'الباييا 🥘 والفلامنكو 💃.', r: 'Spain' }),
    ec('h06', 400, '🐅🏏🛕🍛', 'India', 'الهند', { s: 'easy', r: 'India' }),
    ec('h07', 400, '🐻🪆❄️', 'Russia', 'روسيا', { s: 'easy', n: '🪆 is a matryoshka doll.', nAr: '🪆 دمية الماتريوشكا.', r: 'Russia' }),
    ec('h08', 400, '🥬🌶️🎤📱', 'South Korea', 'كوريا الجنوبية', { s: 'hard', alt: ['Korea'], n: 'Kimchi, K-pop and big phone makers.', nAr: 'الكيمتشي والكيبوب وشركات الجوالات.', r: 'South Korea' }),
    ec('h09', 400, '🕋🐪🌴', 'Saudi Arabia', 'السعودية', { s: 'easy', r: 'Saudi Arabia' }),
    ec('x01', 600, '🗿🌋🏔️', 'Chile', 'تشيلي', { s: 'hard', x: 1, n: 'The moai statues of Easter Island belong to Chile.', nAr: 'تماثيل المواي في جزيرة الفصح تابعة لتشيلي.', r: 'Easter Island' }),
    ec('x02', 600, '🧉⚽🥩💃', 'Argentina', 'الأرجنتين', { s: 'hard', n: 'Mate tea 🧉, steak 🥩 and tango 💃.', nAr: 'شاي المتة 🧉 والستيك 🥩 والتانغو 💃.', r: 'Argentina' }),
    ec('x03', 600, '🦙⛰️🌽', 'Peru', 'بيرو', { s: 'hard', n: 'Llamas, Machu Picchu and corn, first farmed in the region.', nAr: 'اللاما وماتشو بيتشو والذرة.', r: 'Peru' }),
    ec('x04', 600, '🍜🛵🎋', 'Vietnam', 'فيتنام', { s: 'hard', x: 1, n: 'Phở 🍜 and scooters everywhere.', nAr: 'شوربة الفو 🍜 والدراجات في كل مكان.', r: 'Vietnam' }),
    ec('x05', 600, '🕌🫖🎈', 'Turkey', 'تركيا', { s: 'hard', alt: ['Türkiye'], n: 'The balloons are Cappadocia.', nAr: 'البالونات في كابادوكيا.', r: 'Cappadocia' }),
    ec('x06', 600, '🧇🍫🍟', 'Belgium', 'بلجيكا', { s: 'hard', n: 'Waffles, chocolate and fries (Belgium claims them).', nAr: 'الوافل والشوكولاتة والبطاطس المقلية (بلجيكا تقول إنها أصلها).', r: 'Belgium' }),
    ec('x07', 600, '🎼🏰⛷️🍰', 'Austria', 'النمسا', { s: 'hard', x: 1, n: 'Mozart, castles, skiing and Sachertorte.', nAr: 'موتسارت والقلاع والتزلج وكيكة الساخر.', r: 'Austria' }),
  ]);
})();
