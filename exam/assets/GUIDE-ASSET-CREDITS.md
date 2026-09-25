# Asset credits

## Original illustrations

All five PNGs below were generated with the built-in image-generation tool on 25 September 2026. The supplied reference photographs are not included. Anime characters and clinical events are fictional teaching depictions; they do not assert real patient encounters or endorsements.

| File | Use |
| --- | --- |
| `docs/assets/clinic-conversation.png` | Original gouache-style welcome illustration; fictional doctor and older patient |
| `docs/assets/palwasha-listening.png` | Dr Palwasha anime character, attentive conversation |
| `docs/assets/daniyal-explaining.png` | Dr Daniyal anime character, fictional scanner explanation |
| `docs/assets/doctors-handover.png` | Both anime doctors, private colleague handover |
| `docs/assets/doctors-rehearsal.png` | Both anime doctors, friendly rehearsal |

### Prompt set

Welcome: “Create a polished editorial illustration for a friendly German medical communication learning website, portrait 4:5 format. A welcoming adult female doctor with dark hair and warm brown skin sits at eye level listening attentively to an older adult male patient with grey hair in a comfortable clinic consultation room. They are calmly conversing, with simple abstract speech bubbles without writing; a notebook and small houseplant nearby. Thoughtful modern hand-painted gouache/paper texture, rounded shapes, warm cream, muted teal, indigo and coral palette. Dignified, human, reassuring, visually charming, not childish caricature. Natural believable hands, only two people. No text, no logos, no medical procedures, no anatomical diagrams. Intended as a website hero artwork for fictional language-practice stories.”

Shared anime direction: “Use the attached photos as character reference, image1 Dr Palwasha and image2 Dr Daniyal. Create consistent recognizable adult anime characters, refined hand-painted slice-of-life anime editorial art for a medical German learning guide. Dr Palwasha: retain her face shape, warm complexion, dark hijab with rust-red edging; replace outdoor sunglasses with tasteful clear glasses for clinic context. Dr Daniyal: retain swept short black hair, rectangular metal glasses and neatly trimmed full beard. Both wear professional white coats over modest teal/navy clothes, no logos. Respectful and charming, not childish or exaggerated. Warm cream, deep navy, teal, muted coral palette. Natural correct hands. No text or pseudo-writing anywhere, no labels or watermarks. Landscape 3:2 composition. These are fictional teaching scenes, not actual patient events.”

- Listening extension: “Only Dr Palwasha is depicted from the references. She sits at eye level with a fictional older woman patient, listening thoughtfully with open relaxed hands. Patient gestures lightly to explain an everyday concern. Quiet private consultation room, small houseplant, blank notebook. Calm, empathetic, no acute emergency.”
- Explaining extension: “Only Dr Daniyal is depicted from the references. He stands beside a simple stylized MRI scanner model in a welcoming consultation room and uses open-hand gestures to explain it to a fictional adult patient sitting in an armchair. Scanner not in operation, nobody entering or wearing metal near an active scanner. Explanatory educational scene, no anatomical detail.”
- Handover extension: “Both Dr Palwasha and Dr Daniyal are in a private staff room, handing over a fictional case with a blank clipboard and simple abstract colored note cards on a desk. Palwasha explains one detail thoughtfully; Daniyal listens attentively. Both figures equally prominent. Confidential calm professional collaboration; no patients or identifying records.”
- Rehearsal extension: “Both Dr Palwasha and Dr Daniyal practise German communication together at a cozy study table with a small timer, mugs and blank flashcards. Light warm humour: a friendly little desk plant leans towards their conversation like a third listener; both doctors smile naturally. Professional adults learning together. No actual patients or emergency.”

The scanner scene is conceptual art, not an equipment-safety diagram; the depicted scanner is not used to teach MRI screening or room access.

## Web illustrations

- `docs/assets/respiratory.svg`: Theresa Knott and Wikimedia Commons contributors. [Original and revision history](https://commons.wikimedia.org/wiki/File:Respiratory_system.svg). Used unchanged under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). The license applies to this asset, separately from other repository material.
- `docs/assets/urinary.svg`: source US National Cancer Institute / SEER, SVG adaptation by Thstehle. [Original and revision history](https://commons.wikimedia.org/wiki/File:Illu_urinary_system.svg). Wikimedia identifies this work as public domain. Used unchanged.

Both images have visible credits and license links beside them in the guide. They are used as general vocabulary diagrams, not diagnostic images.

## Library

`docs/javascripts/vendor/three.module.js` and `three.core.js`: Three.js **0.180.0**, MIT. License included as `THREE-LICENSE.txt`. Downloaded from the pinned npm package distributed by jsDelivr. The visual is an original three-card communication metaphor. No anatomy is simulated.

Other build dependencies are pinned in `requirements.txt` and supplied through their normal distributions.

## Professional scene collection

Twenty additional PNGs were generated on 25 September 2026 using the same two reference photographs. The complete filename, case, title and alt-text mapping is in content/illustrations.json. Their scene prompts are in content/artwork-prompts.json. All are saved under docs/assets/<asset>.png and displayed in the doctor-scenes gallery and their corresponding case. These bring the doctor illustration total to 24 (25 generated PNGs including the alternate gouache welcome image). Background artwork is decorative, not an anatomy reference.
