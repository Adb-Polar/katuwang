#!/usr/bin/env python3
"""Build the committed, reviewable draft question dataset; never connects to a database."""
import csv, hashlib, json, pathlib, random, sys
sys.path.insert(0,str(pathlib.Path(__file__).parent/'questions'))
from numerical import exercise
ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/'prisma/data/questions'
banks=json.loads((DATA/'concepts.json').read_text())
blueprints=json.loads((DATA/'topic-blueprints.json').read_text())
catalog=json.loads((ROOT/'src/lib/verifiedSubjectCatalog.json').read_text())
expected={(s['slug'],t['name']):t['gradeLevels'] for s in catalog for t in s['topics']}
assert {(b['subject'],b['topic']):b['gradeLevels'] for b in blueprints}==expected

def identifier(text):return 'c'+hashlib.sha256(text.encode()).hexdigest()[:24]
def cards(ref):
 out=[]
 for part in ref.split('+'):
  if '#' in part:
   bank,idx=part.split('#');indices=list(map(int,idx.split(',')))
  elif ':' in part:
   bank,a,b=part.split(':');indices=range(int(a),int(b))
  else:bank=part;indices=range(len(banks[bank]))
  out.extend((bank,i,banks[bank][i]) for i in indices)
 return out

questions=[]
for bp in blueprints:
 key=bp['subject']+'\0'+bp['topic'];seed=int(hashlib.sha256(key.encode()).hexdigest()[:12],16);rng=random.Random(seed)
 positions=[0,1,2,3]*5;rng.shuffle(positions)
 if bp['content'].startswith('@'):
  module=bp['content'][1:];items=[]
  for i in range(20):
   item=exercise(module,i,seed%3);item['contentRef']=f'calculation:{module}:{i+1:02d}';item['language']='en';items.append(item)
 else:
  selected=cards(bp['content']);assert len(selected)==20
  assert len({card['term'].casefold() for _,_,card in selected})==20,bp
  items=[]
  for bank,i,card in selected:
   fil=bank.startswith(('fil_','ap_','economics_','values_')) or bank=='national_identity'
   pool=[x['term'] for x in banks[bank] if x['term']!=card['term']]
   wrong=rng.sample(pool,3)
   desc=card['description'].rstrip('.')
   prompt=(f'Aling termino ang tumutugma sa paglalarawang ito: {desc}?' if fil else f'Which term matches this description: {desc}?')
   explanation=(f'Ang tamang sagot ay {card["term"]}: {desc}.' if fil else f'{card["term"]} is the correct answer: {desc}.')
   items.append(dict(prompt=prompt,answer=card['term'],distractors=wrong,explanation=explanation,contentRef=f'concept:{bank}:{i+1:02d}',language='fil' if fil else 'en',kind='concept'))
 for i,item in enumerate(items):
  # Topic context disambiguates shared foundational concepts across course domains.
  prompt=f'[{bp["topic"]}] {item["prompt"]}'
  qid=identifier(key+'\0'+item['contentRef']);wrong=list(item['distractors']);rng.shuffle(wrong);opts=wrong[:];opts.insert(positions[i],item['answer'])
  options=[dict(text=t,isCorrect=j==positions[i]) for j,t in enumerate(opts)]
  assert 5<=len(prompt)<=1000,(bp,prompt)
  assert 1<=len(item['explanation'])<=1000
  assert len({x['text'].casefold() for x in options})==4,(bp,item)
  assert all(0<len(x['text'])<=500 for x in options)
  questions.append(dict(id=qid,subject=bp['subject'],topic=bp['topic'],gradeLevels=bp['gradeLevels'],number=i+1,language=item['language'],kind=item['kind'],contentRef=item['contentRef'],prompt=prompt,explanation=item['explanation'],options=options))
 assert len({q['prompt'] for q in questions[-20:]})==20,bp
assert len(questions)==len(blueprints)*20
assert len({q['id'] for q in questions})==len(questions)
payload=dict(schemaVersion=1,revision='2026-11-11-v1',authorship='Original AI-assisted draft items; not official DepEd questions or independently teacher-reviewed.',reviewStatus='UNREVIEWED',questionsPerTopic=20,questions=questions)
(DATA/'question-bank.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print(f'Built {len(questions):,} draft questions for {len(blueprints)} topics / {len(catalog)} subjects.')
if '--csv' in sys.argv:
 with (DATA/'question-bank-review.csv').open('w',newline='',encoding='utf-8-sig') as f:
  writer=csv.writer(f);writer.writerow(['ID','Subject','Topic','Grades','Number','Language','Kind','Content reference','Question','A','B','C','D','Correct answer','Explanation','Review status'])
  for q in questions:
   writer.writerow([q['id'],q['subject'],q['topic'],';'.join(q['gradeLevels']),q['number'],q['language'],q['kind'],q['contentRef'],q['prompt'],*[o['text'] for o in q['options']],'ABCD'[next(i for i,o in enumerate(q['options']) if o['isCorrect'])],q['explanation'],'UNREVIEWED'])
 print('Wrote teacher review CSV.')
