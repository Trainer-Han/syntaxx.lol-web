-- Seed content for the lore section, lifted verbatim from the original
-- lore.ts BMW_SEED literal.
--
-- The Express version seeded on process start and then repeatedly patched
-- placeholder rows in place. A Worker has no start-up hook, and re-running
-- that logic per request would be absurd, so the content lives here instead:
-- applied once by `wrangler d1 migrations apply`, versioned in git like any
-- other change. The placeholder-patching pass is gone with it — the real
-- text is inserted directly, so there is nothing left to patch.
--
-- INSERT OR IGNORE keeps re-application harmless.

INSERT OR IGNORE INTO lore_books (server_id, server_name, server_icon, invite_link) VALUES
  ('1196951653509775481', 'BMW Lovers', NULL, 'https://discord.gg/2cRpkXzjJa');

INSERT OR IGNORE INTO lore_chapters (id, server_id, discord_id, display_name, content, chapter_order) VALUES
  ('c16dcb26-552c-4204-be43-702b24f288fd', '1196951653509775481', '981643067792711722', 'Louis (Miao)', 'My name is Louis, though most people in the server know me as Miao.

I joined BMW Lovers on May 7, 2025, when the server was still around fifty thousand members. At the time, I was desperately looking for a community that needed moderators. I wanted to work in Discord servers more than anything, and that search led me straight to BMW Lovers, the place where my story truly began.

I''m twenty-two years old now, and I still feel a rush of excitement every time I think about contributing to this book. The idea that our little corner of the internet has grown into something worthy of its own written lore is genuinely thrilling.

It was here that I first met Roylax, my boss. He is one of the calmest, most low-key people I''ve ever come across, a man of few words in the public channels. But that quiet presence is exactly what makes a good leader.

One of the greatest joys of my time in the server has been the people I''ve met.

There''s Ariana. At first glance, she can come across as sharp and guarded, but those who truly know her understand that beneath the tough exterior lies an incredibly kind heart. She protects her energy fiercely, and she has every right to. She is a major pillar of this community, and I highly recommend reading her part of this book. Her story runs deep.

Around the same time, I met Mark. He and Ariana were inseparable back then, best friends, maybe even more, though none of us were ever quite sure. Mark had an incredible talent for finding the perfect GIF at the perfect moment. I shamelessly stole so many of them, hoping they would land with the same impact they always had when he sent them. He brought a lot of life and laughter to the server. I still wonder where he is these days.

Then there''s Draven. I never got to know him extremely well, but he''s a solid guy. We share the same love for cigarettes, though we respectfully disagree on the brand. He''s a Marlboro Red man. I''m loyal to Marlboro Gold. He now serves as a moderator under my wing, and I''m glad to have him.

Hydro is one of the most interesting people I''ve met here. What most members don''t realize is that he is the owner of BMW Guild, our biggest competitor, a server that has already grown past twenty thousand members. Despite that, he''s become one of our best and most trusted moderators whenever he''s active. He''s funny, authentic, and unapologetically himself. I have nothing but respect for him.

I also brought on Alex as one of our early moderators. You could talk to him for hours about cars. He genuinely knows his stuff. He''s reliable, active, and dedicated. I''m proud to have him on the team.

Those are the people who left the strongest impression on me during my journey.

Of course, no community this large is without its shadows.

There was Zach, or Zacharia, as some knew him. He could be charming if you didn''t know the full truth. He served as a moderator for a while, until we discovered things we couldn''t ignore. It''s a shame. Had he been the person we first believed him to be, he could have been a real asset to the server. His departure left a bittersweet taste.

Then there are the endless advertisements. Bot accounts flood in daily, spamming links no one wants to see. It''s one of the most frustrating parts of running a large server.

Another constant challenge is the lack of a verification system. When we ban someone, there''s nothing stopping them from returning on an alternate account. With nearly two hundred thousand members now, finding those alts feels almost impossible. The server has grown so massive, so quickly.

Still, the good far outweighs the bad.

In BMW Lovers you can expect wild GIF wars, passionate (and sometimes ridiculous) arguments about the most random topics imaginable, genuine technical help for your car (Electrobytezlv and Alex are excellent for that), and plenty of light-hearted minigames in the bot channels. Above all, you''ll find a lot of love and shared passion for BMWs.

The server is also where I met xk_rout, or Rout, as I usually call him. I first encountered him while I was streaming Forza Horizon 5. I was casually playing when I suddenly heard an incredibly deep voice with a familiar accent. I alt-tabbed to check who it was. Sure enough, it was Rout, another Dutch guy. We clicked instantly.

Later, I even met him in real life. He owns some serious cars, the kind that make you do a double take. I won''t list them here, but trust me, they''re not ordinary rides. Rout is one of the chillest people you''ll ever meet. Though we don''t talk as much as we used to because of some complications, I still hold a lot of respect for him. If I could go back and handle things differently, I would. I think most of us feel that way about certain friendships.

You should also check out the #bmw-pic channel. The cars people share there are pure art. BMWs have a certain undeniable sex appeal, and once you see it, you can''t unsee it. I felt it myself. I used to drive an Opel Corsa, but after spending time in the server and asking the community for advice, I ended up with my own E60 525d from 2005 sitting in my driveway. She''s a beast, and I owe that chapter of my life to BMW Lovers.

The server really can influence your life in unexpected ways.

And if you ever see someone named Queen Bee, keep an eye out. You''ll almost certainly spot a bee GIF flying across the chat. It''s just part of her charm.

There''s so much more I could say, but I''ll leave it here. This has been my experience in BMW Lovers, the people, the chaos, the passion, and the sense of belonging.

To everyone reading this: you are welcome here.

The mod team and I warmly welcome you into the server.

Much love,
Louis', 0),
  ('af6201d0-cfdb-456e-89fc-58baf3a780eb', '1196951653509775481', '1380404396306858135', 'Ariana (Ari)', 'My name is Ariana, though most people in the server know me as Ari. I was an old admin of BMW Lovers.

I don''t really know where to begin, but it all started when an old friend who had the BMW tag sent me an invite link. I joined the server expecting very little, yet I ended up staying far longer than I ever thought I would.

In the beginning, I met someone named Zach. Things between us escalated quickly, and he was muted. At the time, I wrongly believed that Louis, known as Miao in the server, had done it. We did not get along at all back then. I accused him of things and said words I shouldn''t have, which resulted in me being muted as well. Eventually, Mark stepped in and helped negotiate with Miao, and I was unmuted.

That early conflict between Miao and me lasted for months. In time, we made peace. I believe he would agree that I am not as difficult as people might first assume. After that, more people entered my life in the server. One of them was Rout, who was originally known as 7. Together with Louis, the three of us shared some of the most enjoyable moments I remember from those days.

Louis and I had a long history filled with both conflict and understanding. When things were calm between us, we were good friends. He is a person with a truly good heart and a big personality. For a long time, he held the server together almost single-handedly.

Over time, I met some of the most meaningful people I have ever encountered in any online community. It still feels strange to say that about a Discord server, but BMW Lovers became something special. Even through arguments and changes, there was a period when everything felt connected.

Eventually, things began to fall apart. There was once a core group that included me, Louis, Rout, Marian, Mark, Flodian, Lindi, E46Headlight, and many others. Over time that group split into smaller circles. Arguments happened, words were spoken, and distance naturally grew between people.

Looking back, I do not regret any of it. The people who were meant to stay found their way back. It is strange how quickly things can change, yet those memories remain valuable.

Each person had their own place in this story. Zach and I had our ups and downs, but in the end we had to part ways. Rout and I always shared a strong connection. I can hardly remember us ever arguing, because he has a way of understanding rather than escalating. He is humble and easily one of the best people in the entire server.

Mark and I have stayed in contact the longest. No matter what conflicts arose in the group, we always managed to remain on good terms. Ilyias was similar. He was easy to get along with and avoided unnecessary drama. Flodian and I had a good friendship. We argued at times, sometimes over the silliest things, but we always found our way back to laughter.

My connection with Marian was more complicated. He can be sensitive, but group calls always felt better when he was there. He had a way of bringing energy to the conversation. Marlon will always be remembered as the biggest larper the server has ever seen, though he is also quite funny.

While I was an admin, there were many challenges, but also many good moments worth remembering. Not everyone always agreed, and sometimes no one agreed at all. Still, I gave the role everything I had.

Sam is an interesting person. We argued plenty of times, but we also shared good laughs. I demoted him more than once and still gave him more chances than I probably should have. Akaisha was always easygoing and calm. I never had any real issues with her. Alex and I had our own ups and downs. For a long time we seemed to be on opposite sides of most things, but he can be a very solid person when the tension is gone.

Everyone mentioned here, even those not named directly, knows who they are. I do not like many people, and there were times I did not like some of you either, but that does not erase what we built. These are real memories.

BMW Lovers was never just a Discord server to me. It was a cycle of meeting people, losing people, arguing, laughing, and somehow creating moments worth keeping. There were times I thought I would leave forever and times I thought I would stay indefinitely. In the end, it became something in between, something real enough to matter.

It was never perfect. There were problems, misunderstandings, ego, and words said in the heat of the moment. But there was also connection, humor, loyalty, and people who made the days brighter just by being there.

To everyone who was part of it, whether we were close or not, you were part of a chapter I will not forget.

And that is all it really is in the end.

A chapter.

Love,
Ari', 1),
  ('9574ca19-ee69-4bbe-9a13-0d22d430ca7c', '1196951653509775481', '1492938343863025745', 'Biney', 'Hello to all the new members of BMW Lovers and everyone reading this book.

My name is Biney. I am seventeen years old and I come from South Korea. Looking back, I can honestly say that BMW Lovers has changed my personality for the better in more ways than I can count. It helped me make a great many friends, some of whom I still keep in touch with to this day. Of course there were a few people who didn''t like me, but I learned not to let them occupy much space in my mind.

BMW Lovers was one of the very first servers I joined after downloading Discord. A friend of mine invited me. He already had the BMW tag, and I thought it looked cool, so I joined just for that. I had no idea what tags really meant at the time. But the moment I started chatting, something felt different. I felt welcomed. I felt at home.

I knew almost nothing about Discord back then. Several members, especially the moderators, patiently helped me learn the ropes. BMW Lovers became my guide to the entire platform, much like a mother teaching her young son how to walk for the first time.

Here is what the server has helped me with the most:

It taught me how to interact with different kinds of people.

It gave me the chance to build many lasting friendships.

When I applied to become a moderator, it taught me how to use moderation commands.

It showed me how to handle situations where people were being rude or insulting toward me or others.

I also learned about server help channels and the many technicians who are always willing to assist.

There are things I loved and things I didn''t love so much.

What I loved most was the strict enforcement against insulting other members, the way certain moderators handled conflicts with care and fairness, especially Hydro, Syntaxx, and 98, and the clean channel organization along with the stylish roles and icons.

What I found difficult was seeing some moderators act unfairly or use their tools against people they personally disliked. I also noticed that rules sometimes didn''t apply to things that happened in private messages, and that responses from the mod team could be quite slow at times. Many moderators were still new to the role and sometimes carried themselves with a sense of power that didn''t always feel right.

Even with its flaws, BMW Lovers holds a special place in my journey. I truly believe most people will enjoy their time here, even if my own experience had its ups and downs.

All my love,
Biney', 2),
  ('f4ea4c7b-bed2-4e0d-a9bc-7300e81db8f1', '1196951653509775481', '1495952489458040952', 'Berry', 'When I first joined the BMW Lovers server, I carried a lot of skepticism with me. To be honest, I disliked almost everyone. The community felt overwhelming, and I kept my guard up high. It took time for that to change.

One of the first people who softened my attitude was Bee. Her kindness stood out right away. She called me pretty one day, and something as simple as that genuinely made me smile. From that moment on, I started to like her. I also found myself warming up to Jasmine. There was something about her personality that felt refreshing and fun.

For a while, most people still irritated me, but a few stood out as genuinely decent. Ole, Canadian, and Draven were okay in my eyes. Draven and I had our moments though. There was a period when he annoyed me so much that I couldn''t stand him, but over time we moved past it, and things are fine between us now. Marlon and Route have always been chill and easy to get along with. Their calm presence made conversations feel more natural and less forced.

Even today, I still find it difficult to connect with many people in the server. Air, in particular, can be exhausting almost all the time, though I have to admit he has his tolerable moments. On the brighter side, I''ve always found the different Jasmines in the community quite funny. Their humor never fails to bring a smile to my face, even on tougher days.

Of course, no server is perfect. I''ve never been a fan of the bots here. They often feel more like obstacles than helpers. The long list of banned words is another thing that frustrates me. It sometimes feels overly strict and gets in the way of natural conversation. Despite all of this, my time in BMW Lovers has been a journey of small changes. I went from hating nearly everyone to slowly finding a few people I actually enjoy talking to. The server has taught me patience and shown me that first impressions aren''t always the full picture.

Berry', 3),
  ('0ab87e4f-48da-4487-af3a-3abeaef8516d', '1196951653509775481', NULL, 'Sam', 'Hello everyone. My name is Sam, and I have been a regular member of the BMW Lovers server since May 2025.

When I first joined the community, I was almost completely silent. For the first five months, I didn''t type a single word. I was the classic lurker, content to simply observe from the sidelines. Day after day, I would scroll through the different channels, admiring everyone''s car photos, reading through the lively discussions, and quietly absorbing the unique energy of the server. I watched conversations unfold, laughed at inside jokes I didn''t fully understand yet, and slowly began to feel like I belonged, even without saying a word.

For nearly half a year, I remained a quiet presence. The chat would fly by with hundreds of messages every day, yet my name was nowhere to be seen. Something about the server felt special though. The warmth and openness of the members eventually made it impossible to stay hidden forever. In late October, I finally took my first small steps. I started with the simplest things: dropping a reaction emoji under a stunning car photo or typing a quick greeting in the general chat. Those first interactions felt bigger than they probably looked.

Before I knew it, those occasional comments grew into real conversations. The more I participated, the more I realized just how genuine and welcoming the community truly was. People were kind, passionate about BMWs, and always ready to include newcomers. The positive atmosphere made it easy to keep coming back. A big part of what makes this server feel so special is the dedication of the owner, the administrators, and the moderators. They work hard to keep things running smoothly, and it shows in how the community feels day to day.

Looking back now, my journey in the server feels almost surreal. The quiet guy who spent five months silently watching slowly transformed into one of the most active members. These days, I''m in the server nearly every single day. Whether we''re passionately debating which generation of BMW has the best design, sharing new car updates, or just joking around in the main chat to pass the time, you''ll usually find me somewhere in the middle of it all.

Joining the conversation was one of the best decisions I''ve made in this community. I''ve met so many interesting people, learned a great deal, and formed friendships I never expected when I first joined as a silent observer. To anyone reading this who might be hesitating to speak up, I encourage you to take that first step. The community is warmer than you might think, and you might just find yourself right at home.

I''m truly grateful I stopped lurking and decided to become part of the story.

Sam', 4),
  ('0636ac43-b29f-46a7-8872-e4393d98f18b', '1196951653509775481', '1465078979085209821', 'Queen Bee', 'My name is Queen Bee, and I''m proudly from South Africa. This is my story and my perspective on BMW Lovers.

I didn''t stumble across the server by accident — I joined through mutual friends. At first, I expected it to be like any other Discord server — a place where people come and go, conversations fade, and nothing really stands out. But I couldn''t have been more wrong.

From the moment I joined, everyone welcomed me with kindness. The atmosphere felt alive. People joked around, had genuine conversations, and made newcomers feel like they belonged. It didn''t take long before I realized this wasn''t just another server — it was a community.

As I spent more time there, I became curious about the staff team. I asked about the moderator requirements because I wanted to contribute instead of simply watching from the sidelines. Before I knew it, I had earned the opportunity to become a Trial Moderator. That moment meant a lot to me. It wasn''t just a role with permissions — it was a sign that people trusted me.

Being a Trial Moderator was an incredible experience. Every day brought something different, whether it was helping members, keeping chats friendly, or working alongside the staff team. Eventually, I was promoted to Moderator, and that achievement made me even more determined to give back to the community that had welcomed me so warmly.

Of course, no community is perfect. Every server has its difficult moments. I''ve had my share of disagreements and interactions that weren''t always easy. That''s simply the reality of social media — you can''t make everyone happy, and not everyone will see eye to eye. But those moments don''t define BMW Lovers. If anything, they''ve shown me how important teamwork, patience, and communication really are.

When I look at BMW Lovers, I don''t just see a Discord server. I see people from different backgrounds coming together, creating friendships, sharing laughs, supporting one another, and building memories. Some members have amazing experiences, while others face challenges, but every story becomes part of what makes this community unique.

As for what I''ve done, I''ve worked hard to help maintain the server, support members whenever I could, and do my best as a moderator. I try to create a welcoming environment where people feel comfortable chatting, making friends, and enjoying their time here. It''s rewarding knowing that even small actions can make someone''s experience a little better.

But my journey isn''t over yet.

My next goal is to become a Supervisor. Not because I want a higher rank, but because I genuinely enjoy working with the staff team. Every staff member I''ve worked with has been supportive, dedicated, and enjoyable to be around. They''re not just people with roles — they''re teammates who all want the same thing: to make BMW Lovers the best community it can be.

If someone asked me to describe BMW Lovers in one sentence, I''d say this:

It''s more than just a server — it''s a place where strangers can become friends, where challenges become lessons, and where every member helps write the story of the community.

This is only one perspective among many, but it''s mine. Looking back, joining this server was one of those unexpected decisions that turned into something genuinely memorable. I''m excited to see where my journey goes next, and I''m proud to be part of the story that BMW Lovers continues to write every single day.', 5),
  ('5e7e254c-c31d-45ea-a22f-b00bc3cea10a', '1196951653509775481', '1205895622251520031', 'Canadian_dude', 'I joined the BMW Lovers server on September 1st, 2025. From the very first moment I stepped inside, I felt a strong and positive vibe. I still remember my earliest messages clearly. I was immediately drawn to the elegant role color gradient and how perfectly it reflected the iconic BMW aesthetic. It was a small detail, but it left a lasting impression. I chatted for a little while and enjoyed the atmosphere, but life soon became busy and I drifted away from the server for some time.

During that period away, I changed my username repeatedly. I went through so many different names that I honestly cannot remember them all anymore.

Then, earlier this year, something simply clicked. There was no single event or reason I can point to. One day I simply found myself opening the server every morning and staying active throughout the day. The more time I spent in the channels, the more I began forming real connections with people. I met some wonderful new friends, and the more we talked, the more attached I became to the community.

Before long, I noticed several of my close friends being promoted to moderators. Watching them take on more responsibility inspired me deeply. I realized I wanted to contribute in the same way and help the server grow. With a mixture of nervousness and excitement, I reached out to Miao and expressed my interest in joining the moderation team. To my absolute delight, he accepted. In that moment, I officially became a moderator.

Since receiving my staff permissions, my dedication to BMW Lovers has grown tremendously. I am more active now than I have ever been before. Every day I take genuine pride in helping maintain a safe, fun, and welcoming environment for everyone. Whether it is answering questions, keeping the peace, or simply being present in the chat, I am fully committed to the role and the community that welcomed me.

This journey has been rewarding in ways I never expected when I first joined. What began as a casual visit has turned into something much more meaningful.

Canadian_Dude', 6);
