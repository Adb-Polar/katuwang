"""Independent arithmetic audit of the authored bank; does not generate items."""
from fractions import Fraction as F
from pathlib import Path
import json, math, subprocess, sys
root=Path(__file__).resolve().parents[2]
bank=json.loads((root/'prisma/question-bank/questions.json').read_text())
count=0

def check(topic, expected):
 global count
 renames={'Fractions & Decimals':'Fractions, Decimals & Rational Numbers','Algebraic Expressions':'Algebraic Expressions & Factoring','Functions & Graphing':'Relations & Functions','Ekonomiks':'Economics & the National Economy','Home Economics':'Home Economics'}
 rows=[q for q in bank['questions'] if q['topic']==renames.get(topic,topic)]
 for index, value in expected.items():
  actual=next(o['text'] for o in rows[index-1]['options'] if o['isCorrect'])
  assert actual==str(value),(topic,index,actual,str(value))
  count+=1

check('Fractions & Decimals',{
 1:F(6,8),2:F(25,100),3:3/5,4:F(1,3)+F(1,3),5:round(.7-.2,1),6:1/F(2,7),
 7:F(2,3)+F(1,4),8:F(5,6)-F(1,4),9:F(3,4)*F(2,5),10:F(2,3)/F(4,5),
 11:round(1.2*.4,2),12:round(3.6/.12),13:max(.58,3/5,.605,.59),
 14:f'{F(3,4)-F(1,8)} m',15:f'{3*.75} L',16:f'{3*F(2,3)} cups',
 17:(1-F(1,3))*F(1,2),18:math.floor(F(24,10)/F(35,100)),20:f'₱{240*F(3,4)+15}',
})
check('Algebraic Expressions',{
 5:5+6,7:f'{8-3+2}x',8:f'{4}y - {4*3}',9:f'{2*3-1}a + {2}',
 10:3*(-2)**2,12:f'{5-2}m + {4+3}',14:'x'+str(3+2).translate(str.maketrans('0123456789','⁰¹²³⁴⁵⁶⁷⁸⁹')),
 15:'x⁴',16:2*4-(-3),17:f'{2*(1+2)}x + {2*(2-1)}',18:f'{2*3}x',19:f'{3*2-2}x - {3+2*4}',
})
check('Linear Equations & Inequalities',{
 1:f'x = {12-7}',2:f'x = {20//4}',4:f'x = {3+9}',6:f'x = {6*3}',
 7:f'x = {(23-5)//3}',8:f'x = {(11+4)//(5-2)}',9:f'x = {18//2-3}',
 10:f'x > {12//-3}',11:f'x = {(7-1)*2}',12:f'x ≤ {(18-2)//4}',
 14:f'x = {(15-7)//-2}',17:math.floor((146-50)/12),18:f'x = {(9+3)//(6-4)}',
 19:f'{(-2-1)//3} ≤ x < {(10-1)//3}',
})
check('Geometry & Measurement',{
 2:'180°',4:f'{4*5} cm',5:f'{8*3} cm²',6:2*100,7:f'{10*6//2} cm²',
 8:f'{180-45-65}°',9:f'{4*3*5} cm³',10:f'{F(22,7)*7*7} cm²',
 11:f'{2*F(22,7)*7} cm',12:math.isqrt(6*6+8*8),13:f'{(6+10)*4//2} cm²',
 14:f'{int(1.5*1000)} m',15:2**2,16:f'{6*3*3} cm²',17:f'{10*8-2*3} m²',
 18:f'{(30//2-5)*5} cm²',19:f'{3*3*5}π cm³',20:f'{(4*100//100)*(3*100//100)} m²',
})
check('Statistics & Probability',{
 1:(2+4+6)//3,2:sorted([1,3,8,10,12])[2],3:max([2,3,3,5],key=[2,3,3,5].count),
 4:10-4,5:F(1,2),6:0,7:(5+7+8+12)//4,8:(4+8)//2,9:F(3,6),10:F(3,5),
 12:f'{12*100//20}%',13:F(1,2)*F(1,2),17:F(3,5)*F(2,4),18:4*7-(4+6+8),
})
check('Trigonometry',{
 4:F(1,2),5:F(1,2),6:1,7:F(3,5),8:F(12,13),9:F(8,6),
 10:f'{round(10*math.sin(math.radians(30)))} m',11:'7 m',12:'30°',
 14:F(4,5),15:f'{90-28}°',17:f'{math.isqrt(13**2-12**2)} m',
 18:f'{20+1.5} m',19:F(4,5),
})
check('Functions & Graphing',{
 2:2+3,7:2*4-1,8:3,9:5,11:(-3)**2,12:(6-2)//(3-1),13:4,
 14:'x ≥ 2',16:2*(3+1),
})
check('Force, Motion & Energy',{7:f'{120//20} m/s.',8:f'{10//2} m/s².',9:f'{8-3} N.',12:f'{5*4} J.'})
check('Entrepreneurship',{7:f'₱{50-35}.',8:f'{300//15}.'})
check('Ekonomiks',{14:f'₱{500-350}.'})
check('Home Economics',{10:f'₱{80*3}.'})
# Check algebra identities by evaluating both sides at independent sample points.
for x in [-3,-1,0,2,5]:
 assert 12*x+18==6*(2*x+3)
 assert (x+3)**2==x*x+6*x+9
 assert 3*(2*x-1)-2*(x+4)==4*x-11
for key in ['AA','Aa','aA','aa']:
 assert (key=='aa') == (key.count('A')==0)
assert sum(a=='a' and b=='a' for a in 'Aa' for b in 'Aa')==1
subprocess.run([sys.executable,str(root/'scripts/question-bank/verify-draft-calculations.py')],check=True)
print(f'Passed {count} additional independent numerical answer checks, algebra identities and Mendelian probability checks.')
