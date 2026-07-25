# Tanaka-san demo audio — record BEFORE building the ingest UI, test with these exact files

Record on iPhone Voice Memos, quiet corner, phone 20cm from mouth, slow and steady like an old man telling a story. Export .m4a. Make TWO files: main (~60s) and backup (~20s). Whoever has the most natural Japanese reads it — slight accent is fine, Whisper handles it.

## MAIN CLIP (~60 sec)

私は田中誠一、七十八歳です。月島で「田中屋」という佃煮の店を五十年やっています。
一番人気は昆布の佃煮です。醤油とみりんと少しの砂糖で、弱火で二時間ほど煮ます。
色で判断してはいけません。音で分かります。泡の音が静かになったら、できあがりです。これが一番大事な秘訣です。
昆布の佃煮は一箱八百円。ちりめんじゃこは六百円です。
お客さんが来たら、「いらっしゃい、毎度どうも」と言います。常連の佐藤さんは、いつも金曜日に昆布を二箱買います。
息子は銀行で働いていて、店は継ぎません。私がやめたら、この店は終わりです。

Romaji (for the reader):
Watashi wa Tanaka Seiichi, nanajū-hassai desu. Tsukishima de "Tanaka-ya" to iu tsukudani no mise o gojū-nen yatte imasu.
Ichiban ninki wa konbu no tsukudani desu. Shōyu to mirin to sukoshi no satō de, yowabi de ni-jikan hodo nimasu.
Iro de handan shite wa ikemasen. Oto de wakarimasu. Awa no oto ga shizuka ni nattara, dekiagari desu. Kore ga ichiban daiji na hiketsu desu.
Konbu no tsukudani wa hito-hako happyaku-en. Chirimenjako wa roppyaku-en desu.
Okyaku-san ga kitara, "Irasshai, maido dōmo" to iimasu. Jōren no Satō-san wa, itsumo kin'yōbi ni konbu o ni-hako kaimasu.
Musuko wa ginkō de hataraite ite, mise wa tsugimasen. Watashi ga yametara, kono mise wa owari desu.

EN gloss (for the deck/subtitles):
"I'm Seiichi Tanaka, 78. I've run Tanaka-ya, a tsukudani shop in Tsukishima, for 50 years. Our best seller is kombu tsukudani — soy sauce, mirin, a little sugar, simmered two hours on low heat. You can't judge it by color. You judge by sound: when the bubbling goes quiet, it's done. That's the most important secret. Kombu is ¥800 a box, chirimenjako ¥600. When customers come in I say 'Irasshai, maido dōmo.' Satō-san, a regular, buys two boxes of kombu every Friday. My son works at a bank and won't take over. When I stop, this shop ends."

## BACKUP CLIP (~20 sec) — in case main file misbehaves
うちのタレは、継ぎ足しで五十年使っています。新しい醤油を足すのは、朝だけです。夜に足すと味が濁ります。これは誰にも教えていません。

Romaji: Uchi no tare wa, tsugitashi de gojū-nen tsukatte imasu. Atarashii shōyu o tasu no wa, asa dake desu. Yoru ni tasu to aji ga nigorimasu. Kore wa dare ni mo oshiete imasen.
EN: "Our sauce has been topped up continuously for 50 years. We only add new soy sauce in the morning — add it at night and the flavor goes muddy. I've never taught this to anyone."

## Why these details matter
Every element maps to a demo beat: the sound cue → Successor-mode answer; prices + products → the storefront; the greeting → the shop's tone in Customer mode; Satō-san Friday → codex "regulars"; the son at the bank → the story. The gaps the clip deliberately leaves (supplier name, chirimenjako method) should appear in codex.gaps[] — point at them in Q&A: "and this is what the heir asks the master next."
