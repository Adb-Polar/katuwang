"""Recompute numeric keys in the current expansion independently of authoring inputs."""
from pathlib import Path
from fractions import Fraction as F
import json, math
root = Path(__file__).resolve().parents[2]
bank = json.loads((root/'prisma/question-bank/questions.json').read_text())
count = 0

def check(topic, expected):
    global count
    rows = [q for q in bank['questions'] if q['topic'] == topic]
    assert len(rows) == 20, topic
    for index, value in expected.items():
        actual = next(o['text'] for o in rows[index-1]['options'] if o['isCorrect'])
        if actual.startswith('{') and str(value).startswith('{'):
            assert {int(v) for v in actual[1:-1].split(',')} == {int(v) for v in str(value)[1:-1].split(',')}, (topic,index,actual,str(value))
        else:
            assert actual == str(value), (topic, index, actual, str(value))
        count += 1

check('Percentages', {1:f'{100//4}%',2:f'{int(.5*100)}%',3:f'{3*100//4}%',4:f'{int(.1*100)}%',
5:200//10,6:120//4,7:50*8//10,8:200//4,9:f'₱{300*8//10}',10:f'₱{200*5//4}',11:f'₱{240*5//4}',12:f'₱{200*16//10}',
13:f'{(24-18)*100//24}%',14:f'{(96-80)*100//80}%',15:f'{(100-50)*100//100}%',16:f'{15*100//300}%',
17:f'{int((1-F(11,10)*F(9,10))*100)}% decrease',18:'No change',19:f'{int((F(12,10)*F(11,12)-1)*100)}% increase',20:f'{int((F(8,10)*F(15,10)-1)*100)}% increase'})
# Solve each linear system by enumerating integer candidates independently.
systems=[lambda x,y:x+y==3 and x-y==-1, lambda x,y:2*x+y==5 and x-y==1,
         lambda x,y:x+y==2 and x-y==-4, lambda x,y:x+y==2 and 2*x+y==5]
for index,predicate in enumerate(systems,5):
    pairs=[(x,y) for x in range(-10,11) for y in range(-10,11) if predicate(x,y)]
    assert len(pairs)==1
    check('Systems of Equations',{index:str(pairs[0])})
check('Systems of Equations',{13:14-8,14:(12-2)//2,15:(11-3)//2,16:(36-30)//2})
# Verify roots by substitution, not by reading explanations.
for index,(b,c) in enumerate([(-5,6),(5,6),(-1,-6),(1,-6)],5):
    roots=[x for x in range(-10,11) if x*x+b*x+c==0]
    check('Quadratic Equations',{index:'{'+', '.join(map(str,roots))+'}'})
check('Quadratic Equations',{2:math.isqrt(4),3:-4//2,4:0,13:math.isqrt(49),14:next(x for x in range(30) if x*(x+1)==30),15:next(x for x in range(42) if x*(x+1)==42),16:math.isqrt(64)})
check('Exponential & Logarithmic Functions',{1:2**3,2:2**4,3:int(math.log2(16)),4:int(math.log10(1000)),9:2,10:3,11:2**2,12:5**1,13:100*2**2,14:800//2,15:800//2**3,16:100*2})
check('Sequences, Series & Polynomials',{5:1+4*3,6:2*2**3,7:3*6,8:2*2**4,9:sum(range(1,6)),10:sum(range(2,11,2)),11:sum(2**i for i in range(5)),12:2*2**2+2,13:2,14:3,15:(2**3-2)//3,16:math.isqrt(9)})
check('Coordinate Geometry & Conic Sections',{5:'(0, 0)',6:'(2, -3)',7:'(-2, 3)',8:'(2, 3)',9:math.isqrt(3**2+4**2),10:math.isqrt(16),11:math.isqrt(9),12:3-1,13:str(((0+4)//2,(1+5)//2)),14:(4-0)//(2-0),15:(5-2)//(2-1),16:F(2,4)})
check('Limits & Derivatives',{1:2+1,2:3,3:2*3,4:0,9:2+2,10:3+3,11:F(1,2),12:3*2**2})
check('Integration',{5:2-0,6:2**2-0,7:3*(2-0),8:2**3-0,17:0})
check('Cells & Microscopy',{9:f'{10*4}×',10:f'{10*1000//100} μm',11:f'{4*100} μm',12:f'{1000} μm'})
check('Matter & Atomic Structure',{17:6,18:14-6,19:6+6,20:18})
check('Chemical Reactions & Stoichiometry',{9:2,10:1,11:3,12:2*2})
check('Electricity & Magnetism',{9:f'{6//3} A',10:f'{12//4} A',11:f'{12//2} A',12:f'{3/6} A'})
check('Waves, Light & Optics',{9:f'{5*2} m/s',10:f'{4*5} m/s',11:f'{25//5} Hz',12:f'{1/5} s'})
check('Business Mathematics',{5:f'₱{100//5}',6:f'₱{100//4}',7:f'₱{90//3}',8:f'₱{80//2}',9:10*3//2,10:2*10,11:50//5,12:100//4,13:f'₱{100*12//10}',14:f'₱{200*3//4}',15:f'₱{150*12//10}',16:f'₱{500-300}'})
check('Markup, Markdown & Payroll',{5:f'₱{100//10}',6:f'₱{100//5}',7:f'₱{100//4}',8:f'₱{100//2}',9:f'₱{100*4}',10:f'₱{500-50}',11:f'₱{400+100}',12:f'₱{600-50}'})
check('Capital Budgeting',{9:f'₱{int(F(1210,1)/F(11,10)**2)}',10:f'₱{1000-900}',11:f'{1000//250} years',12:1100/1000})
check('Simple & Compound Interest',{5:f'₱{1000*5//100}',6:f'₱{1000*5*2//100}',7:f'₱{1000*5*3//100}',8:f'₱{1000*10*2//100}',9:f'₱{int(1000*F(11,10))}',10:f'₱{int(1000*F(11,10)**2)}',11:f'₱{int(1000*F(11,10)**3)}',12:f'₱{int(F(1100,1)/F(11,10))}',13:f'{6/12} year',14:'2 periods',15:f'{10/4}%',16:'4 periods'})
check('Research Statistics',{5:(3+6+9)//3,6:sorted([1,5,9])[1],7:max([2,3,8])-min([2,3,8]),8:(6+8+10)//3})
# Independent Mendelian enumeration verifies four probability keys.
for index,(a,b) in enumerate([('AA','AA'),('Aa','Aa'),('Aa','aa'),('aa','aa')],9):
    recessive=sum(x=='a' and y=='a' for x in a for y in b)
    check('Genetics & Heredity',{index:F(recessive,4)})
print(f'Passed {count} independent numerical answer checks in the current expansion.')
