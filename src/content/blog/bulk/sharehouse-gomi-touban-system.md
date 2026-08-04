---
title: "シェアハウスのゴミ当番管理ツールをAIで作れちゃった話｜前日にLINEで知らせるだけで、完了率が83%→100%になりました"
description: "シェアハウスのオーナーが最近のAIを触っていたら、ゴミ当番の当番表を自動でつくって前日にLINEでリマインドしてくれる仕組みが数日でできてしまいました。人が人に注意する摩擦をツールに肩代わりさせたら、実施率が上がった話。同じものを入れたいオーナーの方はお手伝いします。"
pubDate: 2026-08-04
kind: post
categories: ["ハウス暮らし"]
---

*🇬🇧 English translation follows the Japanese text below.*

最近のAIの進歩がおもしろくて、オーナーである僕はここ数ヶ月わりと本気で色々触っています。本業が経営コンサルなのでAIに触るのは不可避だなと思っていましたが、自分の事業を持ってるのはこういうところで役立ちますね、好きに試せるので。そして作ってみたらハウスのゴミ当番をリマインドしてくれるLINE Botが**数日でできてしまいました**。しかもこれがなかなか具合がいい。

技術の話というより「今こんなものが個人でも簡単に作れちゃうんですよ」というDIYの一例として書きます。

## そもそもゴミ当番の何が面倒だったのか

神戸市はゴミの分別が細かくて、種類ごとに収集の曜日が違います。

- 燃えるごみ … 火・金
- 缶・びん・ペットボトル／容器包装プラスチック … 毎週水曜
- 燃えないごみ／カセットボンベ・スプレー缶 … 第1・第3月曜
- 資源ごみ … 第2・第4金曜
- 冷蔵庫整理（これはハウス内のルール） … 第2土曜

一人暮らしでも普通に忘れる細かさです。これを11部屋で回すとなると、当番表を毎月つくるだけでも地味に面倒くさい。

でもそんなことより大事なのは、**ちゃんとやらせる声掛け**です。

これ、どんなに言い方を選んでも摩擦が残るんですよね。言われたほうは責められた気持ちになるし、言うほうも気を使って疲れる。共同生活で空気を悪くするのは、こういうルール遵守や当番系の問題です。放って置くと、言われなくてもちゃんとやる人と、たまに忘れても「しょうがない」で見逃される人に分かれちゃう。もちろん悪気でサボるひとはそうそういないけども（うちのハウスは治安は良い方です）。でもこういうものって、そのままにしておくとモラルは低下する方にしか動かないし、不公平が残っちゃいますよね。

もちろん忘れないための仕掛けとかも工夫してきたんですが（バンダナを当番の部屋のドアノブに引っ掛けておくというルールもあります）、なんとかもっとリマインドをうまくできないかな？というのと、ちゃんとやる人とサボる人を可視化できないかな？ というのがAI適用のニーズでした。

## 作ったもの：やってることは3つだけ

### ① 当番表が勝手にできる

神戸市の収集日に合わせて、その月の当番表が自動で生成されます。人が表を作る作業がゼロになりました。

![ツールが自動生成した2026年9月のゴミ当番カレンダー。燃えるごみは火・金、缶びんペットボトルと容器包装プラは毎週水曜、燃えないごみとカセットボンベは第1・第3月曜、資源ごみは第2・第4金曜、冷蔵庫整理は第2土曜。日付の下の丸数字が当番の部屋番号](/images/blog/sharehouse-gomi-touban-system/touban-calendar.jpg)

### ② 前日の夜に、当番本人へ個別にLINEを送る

ここが**この仕組みのいちばんの主眼**です。当番表があっても、見なければ意味がありません。なので前日の夜18時ごろに、Botが当番の人へ個別にメッセージを送ります。グループではなく、本人に直接です。

![Botから当番本人に個別で届く自動リマインド。「明日は【缶・プラ・瓶】の日です。当番は4号室さんです。よろしくお願いします」「完了報告は【ハウスのグループLINE】で『#ゴミ完了』と送ってください」](/images/blog/sharehouse-gomi-touban-system/line-reminder.jpg)

こだわったのは3点。

- 前日に流す（当日の朝だと、早く出る人はもう間に合わない）
- 本人に個別で送る（グループに流すと、誰も自分ごとにしない）
- 何をすればいいかまで書く

やるべきことを、やるべき人に、間に合うタイミングで伝える。それだけです。**結果を管理するのではなく、実行される前に思い出させる**というのが全部でした。

ちなみに向きが決まっていて、**リマインドは本人にだけ、完了報告はグループに**流れます。せっつくのは人目のないところで済ませて、やったことのほうが全員に見える。これが逆だったら、たぶんうまくいっていません。

### ③ 「#ゴミ完了」と送るとBotが返事をする

終わったらグループLINEに `#ゴミ完了` と送るだけ。それ以上は何も求めません。

![住人が「#ゴミ完了」と投稿し、Botが「5号室担当のカセットボンベ・不燃ごみ、完了ですね！ゴミ捨てお疲れ様でした！」と自動で返信しているLINE画面](/images/blog/sharehouse-gomi-touban-system/line-report.jpg)

Botが「◯号室担当の△△、完了ですね！ ゴミ捨てお疲れ様でした！」と返してくれます。この「お疲れ様」の一言、最初は完全におまけのつもりで付けたんですが、これが意外と効いていたようです（後述）。

## 結果：83% → 94% → 100%

裏側では実施の記録が貯まっていくので、3ヶ月ぶんを集計してみました。

![ゴミ当番の実績統計画面。当番総数53回、実施済49回92%、月別完了率は5月83%・6月94%・7月100%](/images/blog/sharehouse-gomi-touban-system/stats-summary.jpg)

| 月 | 実施 / 当番 | 完了率 |
|---|---|---|
| 5月 | 15 / 18 | 83% |
| 6月 | 16 / 17 | 94% |
| 7月 | **18 / 18** | **100%** |
| 3ヶ月合計 | 49 / 53 | 92% |

（4月は動かし始めたばかりで記録自体が不正確なので外しています）

ちなみにこの統計、住人には特に知らせていませんでした。**誰かを責めるための材料にする気はゼロ**で、まずは「自分が作ったものは効いているのか？」を確認したかったからです。人を責める道具にすると、こういうものはたいてい失敗するし。

それで結果を見て分かったのは、**意外と当番の実行率が上がってた！ということ**。運用前は「やらない人がいるんだろうな」と思っていたのに、前日に名指しで知らせるようにしただけで100%まで上がってしまいました。統計取って発表するなんて言ってなかったのに。意識や態度のせいじゃなくて、仕組みが足りなかったんだなと。

## 住人からの反応

住人のひとりがグループにこう書いてくれていました。

![LINEでの住人の反応。「前日にお知らせが来るのはとてもわかりやすくて、助かります。ゴミ捨てお疲れ様の一言も何気に嬉しいです」](/images/blog/sharehouse-gomi-touban-system/resident-voice.jpg)

> 前日にお知らせが来るのはとてもわかりやすくて、助かります。
> ゴミ捨てお疲れ様の一言も何気に嬉しいです🙌

管理された感じではなく、助かる感じになっていたのはよかったです。おまけのつもりだった「お疲れ様」が効いていたのも、小さいけど気分をよくするものになってたのはよかった。

## できてないところもある

![ゴミ種別ごとの実施状況。燃えるゴミ23/25で92%、缶・プ・瓶13/13で100%、カセット・不燃6/6で100%、資源6/6で100%、冷蔵庫整理1/3で33%](/images/blog/sharehouse-gomi-touban-system/stats-by-type.jpg)

種別ごとに見ると、**冷蔵庫整理だけ3回中1回（33%）で明らかに低いです**。ゴミ出しと違って「収集車が来る」という外部の締め切りがないので、リマインドが来ても後回しにできてしまうのかもですね。ここはまだ宿題です。

## 作ってみた感想

コードはほぼAIに書いてもらいました。僕がやったのは「こういうものが欲しいけどできる？」から入って、「こうして！」とか「そうじゃなくて」と指示を入れ、動かしてみて、ズレたところを直してもらう、の繰り返しです。めっちゃ集中（笑）して作ったとはいえ、数日です。

数年前なら外注して数十万円コース、あるいは「まあいいか」と諦めていた類の話が、思いつきから数日で動いてしまう。しかも生活が実際にちょっと良くなる。この規模の困りごとを自分で解けるようになったのが、いま個人でAIを触っていていちばんおもしろいところだと思います。これ以外にも住民に頼んでいる備品の買い物に対する経費精算ツール（レシートの自動読み取りと記録）も作りました。

## 同じものを入れたいシェアハウスオーナーの方へ

まあこんな感じで自慢できるものではないんですが、もしも同じ悩みを抱えているオーナーさんがいたら、この仕組み入れるの手伝いますよ。収集日のルールは自治体ごとに違うので、そこを差し替えれば基本的にどこでも動くはずですし。[お問い合わせフォーム](/contact/)から「ゴミ当番Botの件」とでも書いて連絡してください。

もちろん、[入居に興味がある方](/rooms/)のご連絡も歓迎です。うちのハウスは、こういうことを面白がってやっているオーナーがいる場所です。

*数字は2026年7月30日時点の集計です。*

---

# I built a bin-duty tool for our share house with AI — a day-ahead LINE reminder took us from 83% to 100%

I've been messing around in earnest with what today's AI tools can do. I work as a management consultant, so getting to grips with AI was unavoidable either way — and this is where having your own business helps: you can try things on it freely. So I did, and ended up **building a LINE bot in a few days** that handles bin duty for our share house. It works surprisingly well.

Less a technical post than a "look what one person can knock together now" sort of post.

## What was actually annoying about bin duty

Kobe sorts waste finely, and each category has its own collection day: burnables on Tuesday and Friday, cans/bottles/PET and packaging plastics every Wednesday, non-burnables and aerosol cans on the first and third Monday, recyclables on the second and fourth Friday — plus our own in-house fridge clear-out on the second Saturday.

That's easy enough to forget living alone. Across 11 rooms, even just drawing up the monthly roster is a chore.

But the roster matters less than the thing that actually gets people to do it: **the nudge**.

No matter how carefully you word it, friction remains. The person hearing it feels told off; the person saying it burns energy being tactful. In shared living it's exactly these rules-and-rota matters that sour the atmosphere. Leave it be and you get a split: people who get on with it without being asked, and people who forget now and then and get waved through because, well, these things happen. Not that anyone is deliberately skiving — ours is a well-behaved house. But this sort of thing only ever drifts one way, and the unfairness stays.

We'd tried low-tech fixes — there's a rule where a bandana gets hung on the door handle of whoever is on duty. But could the reminding be done better than that? And could we actually see who does it and who doesn't? That was what I wanted AI for.

## What it does — three things, that's it

### 1. The roster builds itself

![Automatically generated bin duty calendar for September 2026, showing burnable waste on Tuesdays and Fridays, cans and plastics on Wednesdays, non-burnables on the first and third Mondays, and recyclables on the second and fourth Fridays](/images/blog/sharehouse-gomi-touban-system/touban-calendar.jpg)

Generated automatically against Kobe City's collection calendar. Nobody makes a table anymore.

### 2. The evening before, a direct message to whoever is on duty

**This is the whole point of the thing.** A roster nobody looks at is useless, so at around 6pm the day before, the bot messages the person on duty directly — not the group, the individual.

![Automated LINE reminder sent directly to the resident on duty, naming the room and the waste category for the next day](/images/blog/sharehouse-gomi-touban-system/line-reminder.jpg)

Three deliberate choices: send it the night before (morning-of is too late for anyone leaving early), send it to the person rather than the group (address everyone and it belongs to nobody), and say exactly what to do.

The right thing, to the right person, in time to act on it. That's all. **Not managing the outcome — reminding before the fact.**

The direction matters, too: **the reminder goes to one person, the completion report goes to the group.** The nudging happens out of sight; what gets done is what everyone sees. The other way round would probably have failed.

### 3. You reply with a hashtag and the bot answers

Post `#ゴミ完了` ("bin duty done") in the group when you're finished. Nothing more is asked of anyone.

![LINE screen showing a resident posting the completion hashtag and the bot replying to confirm which room and which waste category was completed](/images/blog/sharehouse-gomi-touban-system/line-report.jpg)

The bot replies confirming what was done and adds a "thanks for taking the bins out." I threw that line in as an afterthought. Turns out it mattered — more on that below.

## The result: 83% → 94% → 100%

Completions log themselves in the background, so I totted up three months.

![Bin duty statistics dashboard showing 53 total duties, 49 completed at 92%, and monthly completion rates of 83% in May, 94% in June and 100% in July](/images/blog/sharehouse-gomi-touban-system/stats-summary.jpg)

| Month | Completed / assigned | Rate |
|---|---|---|
| May | 15 / 18 | 83% |
| June | 16 / 17 | 94% |
| July | **18 / 18** | **100%** |
| Three-month total | 49 / 53 | 92% |

(April is excluded — we'd only just started and the records aren't reliable.)

I hadn't actually told the residents these statistics existed. **They were never meant as ammunition against anyone** — first of all I wanted to know whether the thing I'd built was working. Turn something like this into a way of blaming people and it usually fails.

What the numbers showed: **completion had climbed further than I expected.** I'd assumed some people just didn't do it. A named reminder the night before took it to 100% — and I'd never announced that I was keeping statistics at all. Nothing was wrong with anyone's attitude; there was simply no system.

## What the residents said

One of them posted this in the group chat:

![A resident's reaction in LINE, saying the day-before notice is easy to follow and helpful, and that the bot's thank-you message is quietly nice to receive](/images/blog/sharehouse-gomi-touban-system/resident-voice.jpg)

> Getting the notice the day before is really clear and helpful.
> And the little "thanks for taking the bins out" is unexpectedly nice. 🙌

Helpful rather than policed — that's the part I'm happiest about. And the throwaway thank-you line turning into a small lift in someone's day was a good surprise.

## Where it still falls short

![Completion by waste category: burnables 23/25 at 92%, cans and plastics 13/13 at 100%, non-burnables 6/6 at 100%, recyclables 6/6 at 100%, fridge clear-out 1/3 at 33%](/images/blog/sharehouse-gomi-touban-system/stats-by-type.jpg)

By category, **the fridge clear-out sits at 1 of 3 (33%)**, clearly the weakest. Unlike rubbish, no truck is coming, so there's no external deadline — perhaps that's why the reminder is easy to put off. Still an open problem.

## Thoughts on building it

The AI wrote nearly all the code. My part was starting from "here's what I want — can you do it?", then "do this", "no, not like that", running it, and telling it what felt off — on repeat. I was thoroughly absorbed while it lasted, but it was still only a few days.

A few years ago this would have meant outsourcing it for a few thousand dollars, or more likely just putting up with the problem. Now an idea turns into a working thing in a few days, and daily life gets slightly better. Being able to solve your own problems at this scale is the most interesting thing about the current moment. I've built other things on the same principle since — an expense tool that reads receipts automatically and logs the supply shopping residents do for the house.

## If you run a share house and want the same setup

It isn't much to boast about, but if another operator has the same headache, I'm happy to help you put the same thing in place. Collection rules differ by municipality, but swap that part out and it should work anywhere. Drop us a line through the [contact form](/contact/) mentioning the bin-duty bot.

And of course, if you're [interested in living here](/en/rooms/), get in touch too. This is a house run by someone who enjoys building this sort of thing.

*Figures as of 30 July 2026.*
