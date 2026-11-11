"""Independent regression examples and option checks for worked exercises."""
import json,pathlib,unittest
from fractions import Fraction
from numerical import exercise
ROOT=pathlib.Path(__file__).resolve().parents[2]
class NumericalExercises(unittest.TestCase):
 def test_known_answers(self):
  # Expected answers were worked out separately for i=0, offset=0.
  examples={
   'stats_probability':'5','geometry':'15 cm²','general_geometry':'15 cm²',
   'algebra':'2','measurement':'300 cm','numbers':'2','general_algebra':'255 pesos',
   'modeling':'130 pesos','angles':'1/2','trig_functions':'3/5','trig_identities':'4/5',
   'limits':'11','derivatives':'12','differentiation':'30','derivative_applications':'17 m/s',
   'antiderivatives':'6','definite_integrals':'6','ph':'2','titration':'0.083 mol/L',
   'buffer':'3.20','equilibrium':'0.375','colorimetry':'0.200','cell_potential':'0.60 V',
   'electrolysis':'0.2962 g','electrostatics':'0.1350 N','current_electricity':'5 Ω',
   'magnetism':'1.60 N','induction':'1.500 V','lines_circles':'5','graph_transforms':'3',
   'polynomials':'15','rational_functions':'5','exponential_logarithmic':'3',
   'measurement_science':'5 g/cm³','kinematics':'15 m','dynamics':'15 N',
   'kitchen_math':'900 g','sql_results':'4',
  }
  for module,expected in examples.items():
   with self.subTest(module=module):self.assertEqual(exercise(module,0)['answer'],expected)
 def test_every_numeric_choice_is_distinct_in_value(self):
  modules={b['content'][1:] for b in json.loads((ROOT/'prisma/data/questions/topic-blueprints.json').read_text()) if b['content'].startswith('@')}
  for module in modules:
   for offset in range(3):
    prompts=[]
    for i in range(20):
     item=exercise(module,i,offset);prompts.append(item['prompt'])
     values=[Fraction(x.split(' ')[0]) for x in [item['answer'],*item['distractors']]]
     with self.subTest(module=module,offset=offset,item=i):self.assertEqual(len(set(values)),4)
    self.assertEqual(len(set(prompts)),20,module)
 def test_extra_rule_cases(self):
  self.assertEqual(exercise('limits',1)['answer'],'4')
  self.assertEqual(exercise('ph',1)['answer'],'12')
  self.assertEqual(exercise('titration',3)['answer'],'30.00 mL')
  self.assertEqual(exercise('antiderivatives',2)['answer'],'14')
  self.assertEqual(exercise('sql_results',1)['answer'],'13')
  self.assertEqual(exercise('sql_results',2)['answer'],'50')
  self.assertEqual(exercise('sql_results',3)['answer'],'200')
if __name__=='__main__':unittest.main()
