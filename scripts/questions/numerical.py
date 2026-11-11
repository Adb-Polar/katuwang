"""Deterministic worked exercise authoring. No database or network access."""
from fractions import Fraction
import math, sqlite3

def fmt(n):
 if isinstance(n,Fraction): return str(n)
 if isinstance(n,str): return n
 if abs(n)<0.0001 and n!=0:return f'{n:.4e}'
 return f'{n:.4f}'.rstrip('0').rstrip('.') if n!=0 else '0'

def numeric(prompt,answer,explanation,unit='',precision=None):
 if precision is not None:
  prompt+=f' Round to {precision} decimal places.'
  format_value=lambda x:f'{float(x):.{precision}f}'
 else: format_value=fmt
 choices=[answer]
 for candidate in [answer*2,answer/2,answer+1,answer-1,answer+2,answer*3,answer+5]:
  if format_value(candidate) not in [format_value(x) for x in choices]:choices.append(candidate)
  if len(choices)==4:break
 assert len(choices)==4
 suffix=f' {unit}' if unit else ''
 texts=[format_value(v)+suffix for v in choices]
 return dict(prompt=prompt,answer=texts[0],distractors=texts[1:],explanation=explanation+f' The answer is {texts[0]}.',kind='calculation')

def exercise(module,i,offset=0):
 j=i%4;k=i//4+offset+2;a=k+1;b=k+3
 if module in ['colorimetry','cell_potential','magnetism','equilibrium']:
  a=i+offset+2;b=a+2
 def q(p,x,e,u='',precision=None):return numeric(p,x,e,u,precision)
 if module=='stats_probability':
  if j==0:return q(f'Find the mean of {k}, {k+2}, {k+4}, and {k+6}.',k+3,f'The sum is {4*k+12}; divide by 4.')
  if j==1:return q(f'Find the median of {k}, {k+2}, {k+7}, {k+9}, and {k+10}.',k+7,'For five ordered values, the third value is the median.')
  if j==2:return q(f'A bag has {a} red and {b} blue counters. One counter is drawn at random. What is the probability of red?',Fraction(a,a+b),f'Favorable outcomes / all outcomes = {a}/{a+b}.')
  return q(f'The scores are {k}, {k+4}, {k+4}, {k+9}, and {k+12}. What is the range?',12,f'Range = maximum − minimum = {k+12} − {k}.')
 if module in ['geometry','general_geometry']:
  if j==0:return q(f'A rectangle measures {a} cm by {b} cm. What is its area?',a*b,f'Area = length × width = {a} × {b}.','cm²')
  if j==1:return q(f'A triangle has base {2*a} m and perpendicular height {b} m. Find its area.',a*b,f'Area = ½ × base × height = ½ × {2*a} × {b}.','m²')
  if j==2:return q(f'A right triangle has legs {3*a} cm and {4*a} cm. Find its hypotenuse.',5*a,f'By Pythagoras, √({3*a}² + {4*a}²) = {5*a}.','cm')
  return q(f'A cylinder has radius {a} cm and height {b} cm. Using π = 3.14, find its volume.',3.14*a*a*b,f'V = πr²h = 3.14 × {a}² × {b}.','cm³',2)
 if module=='algebra':
  if j==0:return q(f'Solve {a}x + {b} = {a*k+b}.',k,f'Subtract {b} and divide by {a}.')
  if j==1:return q(f'If f(x) = {a}x² − {b}, find f(2).',4*a-b,f'Substitute x = 2: {a}(2²) − {b}.')
  if j==2:return q(f'An arithmetic sequence begins {k}, {k+3}, {k+6}. What is its tenth term?',k+27,f'Tenth term = first term + 9d = {k} + 9(3).')
  return q(f'For y = {a}x + {b}, what is y when x = −2?',b-2*a,f'Substitute x = −2: {a}(−2) + {b}.')
 if module=='measurement':
  if j==0:return q(f'Convert {a} meters to centimeters.',100*a,'Multiply meters by 100.','cm')
  if j==1:return q(f'Convert {b} liters to milliliters.',1000*b,'One liter equals 1,000 milliliters.','mL')
  if j==2:return q(f'A trip lasts {a} hours and 30 minutes. Express its duration in minutes.',a*60+30,f'Minutes = {a} × 60 + 30.','min')
  return q(f'A rectangular floor is {a} m by {b} m. Tiles cover 0.25 m² each. Ignoring cutting and waste, how many tiles are required?',4*a*b,f'Floor area / tile area = {a*b} / 0.25.','tiles')
 if module=='numbers':
  if j==0:return q(f'Evaluate −{a} + {b}.',b-a,'Adding a positive value to a negative value gives their signed sum.')
  if j==1:return q(f'Find 25% of {20*a}.',5*a,f'25% = ¼, so divide {20*a} by 4.')
  if j==2:return q(f'Find 1/{a} + 1/{2*a}.',Fraction(3,2*a),f'Use denominator {2*a}: 2/{2*a} + 1/{2*a}.')
  return q(f'Evaluate ({a} + {b}) × 3 − 4.',3*(a+b)-4,'Evaluate parentheses first, then multiply, then subtract.')
 if module=='general_algebra':
  if j==0:return q(f'An item costs ₱{100*a} before a 15% discount. What is the sale price?',85*a,f'Sale price = {100*a} × (1 − 0.15).','pesos')
  if j==1:return q(f'Find the simple interest on ₱{1000*a} at 5% per year for {b} years.',50*a*b,f'I = Prt = {1000*a} × 0.05 × {b}.','pesos')
  if j==2:return q(f'A worker earns ₱{50*a} per hour for {b} hours. What is the gross pay?',50*a*b,f'Gross pay = hourly rate × hours = {50*a} × {b}.','pesos')
  return q(f'A geometric sequence has first term {a} and ratio 2. Find its fifth term.',16*a,f'a₅ = a₁r⁴ = {a} × 2⁴.')
 if module=='modeling':
  if j==0:return q(f'A printing cost model is C(n) = {10*a} + {b}n pesos. Find C(20).',10*a+20*b,f'Substitute n = 20: {10*a} + {b}(20).','pesos')
  if j==1:return q(f'A population model is P(t) = {100*a}(2^t). What is P(3)?',800*a,f'P(3) = {100*a} × 2³.')
  if j==2:return q(f'Profit is modeled by P(x) = −x² + {2*a}x + {b}. At what x is profit maximized?',a,f'The vertex occurs at −B/(2A) = −{2*a}/(−2).')
  return q(f'A water tank contains {100*a} liters and drains at {b} liters per minute. How much remains after 5 minutes?',100*a-5*b,f'V(t) = V₀ − rt; V(5) = {100*a} − 5({b}).','L')
 if module=='angles':
  if j==0:return q(f'Express {30*a}° in radians as a multiple of π. Which coefficient multiplies π?',Fraction(a,6),f'Radians = degrees × π/180 = {a}π/6.')
  if j==1:return q(f'Convert {a}π/3 radians to degrees.',60*a,f'Multiply radians by 180/π: {a} × 180/3.','degrees')
  if j==2:return q(f'A sector has radius {a} cm and central angle 2 radians. Find its arc length.',2*a,'Arc length s = rθ, with θ in radians.','cm')
  return q(f'An angle is {30*a}°. What is the measure of a positive coterminal angle obtained by adding one full turn?',30*a+360,'A full turn is 360°.','degrees')
 if module=='trig_functions':
  if j==0:return q(f'In a right triangle, the side opposite θ is {3*a} and the hypotenuse is {5*a}. Find sin θ.',Fraction(3,5),'sin θ = opposite / hypotenuse.')
  if j==1:return q(f'In a right triangle, the side adjacent to θ is {4*a} and the hypotenuse is {5*a}. Find cos θ.',Fraction(4,5),'cos θ = adjacent / hypotenuse.')
  if j==2:return q(f'A right triangle has opposite side {a} and adjacent side {b} relative to θ. Find tan θ.',Fraction(a,b),'tan θ = opposite / adjacent.')
  return q(f'The function is y = {a}sin({b}x), with x in radians. What is its amplitude?',a,'The amplitude of A sin(Bx) is |A|.')
 if module=='trig_identities':
  op,adj,hyp=[(3,4,5),(5,12,13),(8,15,17),(7,24,25),(20,21,29)][(i//4+offset)%5]
  sn=Fraction(op,hyp);cs=Fraction(adj,hyp)
  if j==0:return q(f'sin θ = {sn} and θ is acute. Find cos θ.',cs,f'cos²θ = 1 − sin²θ; choose the positive root because θ is acute.')
  if j==1:return q(f'tan α = {a}. Find sec²α.',1+a*a,'Use sec²α = 1 + tan²α.')
  if j==2:return q(f'sin β = {sn} and cos β = {cs}. Find sin(2β).',2*sn*cs,'sin(2β) = 2 sinβ cosβ.')
  return q(f'sin γ = {sn}. Find cos(2γ).',1-2*sn*sn,'cos(2γ) = 1 − 2sin²γ.')
 if module=='limits':
  if j==0:return q(f'Find lim as x → {k} of ({a}x + {b}).',a*k+b,'A polynomial is continuous, so substitute the limiting value.')
  if j==1:return q(f'Find lim as x → {k} of (x² − {k*k})/(x − {k}).',2*k,f'Factor x² − {k*k} = (x − {k})(x + {k}); the limit is {k} + {k}.')
  if j==2:return q(f'Find lim as x → 0 of sin({a}x)/x, with angles in radians.',a,f'Use lim sin(u)/u = 1 and u = {a}x.')
  return q(f'Find lim as x → ∞ of ({a}x² + 1)/({b}x² − 3).',Fraction(a,b),'For equal polynomial degrees, use the ratio of leading coefficients.')
 if module=='derivatives':
  if j==0:return q(f'If f(x) = {a}x² + {b}, find f′(2).',4*a,f'f′(x) = {2*a}x; evaluate at x = 2.')
  if j==1:return q(f'Find the slope of the tangent to y = {a}x³ at x = 1.',3*a,f'dy/dx = {3*a}x²; substitute x = 1.')
  if j==2:return q(f'If f(x) = {a}x − {b}, what is f′({k})?',a,'The derivative of mx + c is m.')
  return q(f'If f(x) = {a}/x, find f′(1).',-a,f'f(x) = {a}x⁻¹, so f′(x) = −{a}x⁻².')
 if module=='differentiation':
  if j==0:return q(f'If y = ({a}x + {b})², find dy/dx at x = 0.',2*a*b,f'Chain rule: dy/dx = 2({a}x + {b})({a}).')
  if j==1:return q(f'If y = x²({a}x + {b}), find dy/dx at x = 1.',3*a+2*b,f'Product rule gives 2x({a}x + {b}) + {a}x².')
  if j==2:return q(f'If y = ln({a}x), for x > 0, find dy/dx at x = {b}.',Fraction(1,b),'Chain rule gives d[ln(ax)]/dx = a/(ax) = 1/x.')
  return q(f'If y = e^({a}x), find dy/dx at x = 0.',a,f'The derivative is {a}e^({a}x); e⁰ = 1.')
 if module=='derivative_applications':
  if j==0:return q(f'Position is s(t) = {a}t² + {b}t meters. Find velocity at t = 2 seconds.',4*a+b,f'v(t) = ds/dt = {2*a}t + {b}.','m/s')
  if j==1:return q(f'Cost is C(x) = {a}x² + {b}x + 100 pesos. Find marginal cost at x = 3.',6*a+b,f'Marginal cost C′(x) = {2*a}x + {b}.','pesos per unit')
  if j==2:return q(f'Profit is P(x) = −x² + {2*a}x − {b}. Find the x-coordinate of its maximum.',a,f'P′(x) = −2x + {2*a} = 0 gives x = {a}; P″ = −2 < 0.')
  return q(f'A circle has radius {a} cm increasing at 2 cm/s. Find dA/dt using π = 3.14.',4*3.14*a,'A = πr², so dA/dt = 2πr(dr/dt).','cm²/s',2)
 if module=='antiderivatives':
  if j==0:return q(f'An antiderivative F of f(x) = {a}x satisfies F(0) = 0. Find F(2).',2*a,f'F(x) = ({a}/2)x² + C; F(0) = 0 sets C = 0.')
  if j==1:return q(f'In ∫ {3*a}x² dx = A x³ + C, what is A?',a,f'Increase the power to 3 and divide {3*a} by 3.')
  if j==2:return q(f'F′(x) = {a} and F(0) = {b}. Find F(3).',3*a+b,f'F(x) = {a}x + {b}.')
  return q(f'In ∫ {a}e^x dx = A e^x + C, what is A?',a,'The derivative of e^x is e^x, so its coefficient stays the same.')
 if module=='definite_integrals':
  if j==0:return q(f'Evaluate ∫ from 0 to 2 of {a}x dx.',2*a,f'An antiderivative is ({a}/2)x²; evaluate at 2 and 0.')
  if j==1:return q(f'Evaluate ∫ from 1 to {b} of {a} dx.',a*(b-1),f'The integral of a constant is the constant times the interval width: {a}({b} − 1).')
  if j==2:return q(f'Evaluate ∫ from 0 to 1 of {3*a}x² dx.',a,f'An antiderivative is {a}x³; its value at 1 minus its value at 0 is {a}.')
  return q(f'Find the area under y = {a}x + {b} above the x-axis from x = 0 to x = 2.',2*a+2*b,f'The function is positive on this interval. Integrate to obtain [({a}/2)x² + {b}x]₀².','square units')
 if module=='ph':
  if j==0:return q(f'An ideal dilute solution has [H⁺] = 1.0 × 10^(−{k}) mol/L. Find its pH.',k,'pH = −log₁₀[H⁺].')
  if j==1:return q(f'At 25°C, an ideal dilute solution has [OH⁻] = 1.0 × 10^(−{k}) mol/L. Find its pH.',14-k,f'pOH = {k}; at 25°C, pH = 14 − pOH.')
  if j==2:return q(f'A fully dissociated monoprotic strong acid has concentration {a} × 10⁻⁴ mol/L. Treat activity as concentration. Find pH.',-math.log10(a*1e-4),'For a monoprotic strong acid, [H⁺] equals the stated concentration; pH = −log₁₀[H⁺].','',2)
  return q(f'A fully dissociated strong base supplies [OH⁻] = {a} × 10⁻³ mol/L at 25°C. Find pOH.',-math.log10(a*.001),'pOH = −log₁₀[OH⁻].','',2)
 if module=='titration':
  acid=10*a;vol=5*b;base=.1 if j%2==0 else .2
  if j<2:return q(f'A {acid} mL monoprotic acid sample reaches equivalence with {vol} mL of {base} mol/L NaOH. What is the acid molarity? Assume a 1:1 reaction.',base*vol/acid,f'At equivalence, M_acid V_acid = M_base V_base; {base} × {vol}/{acid}.','mol/L',3)
  if j==2:return q(f'How many mL of 0.100 mol/L NaOH neutralize {acid} mL of 0.0500 mol/L HCl?',acid/2,f'The 1:1 reaction requires V_base = 0.0500({acid})/0.100.','mL',2)
  return q(f'How many mL of 0.100 mol/L NaOH neutralize {acid} mL of 0.0500 mol/L H₂SO₄? Assume both acidic protons react completely.',acid,'The stoichiometric ratio is 2 mol NaOH per mol H₂SO₄; V = 2(0.0500)V_acid/0.100.','mL',2)
 if module=='buffer':
  pka=4+.1*k;ratio=[.1,1,10,2][j]
  return q(f'A weak-acid buffer has pKa = {pka:.1f}, [HA] = 0.100 mol/L, and [A⁻] = {ratio*.1:.3f} mol/L. Using the Henderson–Hasselbalch approximation, find pH.',pka+math.log10(ratio),f'pH = pKa + log₁₀([A⁻]/[HA]) = {pka:.1f} + log₁₀({ratio}).','',2)
 if module=='equilibrium':
  if j<2:
   av=.1*a;bv=.1*b;cv=.01*(k+j+1)
   return q(f'For A(aq) + B(aq) ⇌ C(aq), equilibrium concentrations are [A] = {av:.2f} M, [B] = {bv:.2f} M, [C] = {cv:.2f} M. Calculate the numerical value of Kc.',cv/(av*bv),'For this reaction, Kc = [C]/([A][B]).','',3)
  return q(f'For A(aq) ⇌ 2B(aq), [A] = {a:.1f} M and [B] = {b:.1f} M at equilibrium. Calculate the numerical value of Kc.',b*b/a,'Kc = [B]²/[A]; coefficients become exponents.','',3)
 if module=='colorimetry':
  if j%2==0:return q(f'Using Beer–Lambert law, ε = {100*a} L mol⁻¹ cm⁻¹, path length = 1.00 cm, and concentration = 0.00100 mol/L. Find absorbance.',a*.1,f'A = εlc = {100*a} × 1.00 × 0.00100.','',3)
  return q(f'A solution has absorbance {a*.1:.2f}, ε = {100*b} L mol⁻¹ cm⁻¹, and path length {j}.00 cm. Find its concentration.',a*.1/(100*b*j),'Rearrange A = εlc to obtain c = A/(εl).','mol/L',6)
 if module=='cell_potential':
  ec=.1*a;ea=-.1*b
  if j%2==0:return q(f'A galvanic cell has cathode reduction potential +{ec:.2f} V and anode reduction potential {ea:.2f} V under standard conditions. Find E°cell.',ec-ea,'E°cell = E°red(cathode) − E°red(anode).','V',2)
  return q(f'E°cell = {ec-ea:.2f} V and E°red(anode) = {ea:.2f} V. Find E°red(cathode).',ec,'Rearrange E°cell = E°cathode − E°anode to obtain E°cathode = E°cell + E°anode.','V',2)
 if module=='electrolysis':
  current=a;time=60*(b+j);mass=63.5;n=2
  if j<2:return q(f'A Cu²⁺ solution is electrolyzed at {current} A for {time} s. Use molar mass Cu = 63.5 g/mol and F = 96485 C/mol. At 100% current efficiency, what copper mass deposits?',current*time*mass/(n*96485),'Cu²⁺ + 2e⁻ → Cu, so m = ItM/(2F).','g',4)
  return q(f'A current of {current} A passes through an electrolytic cell for {time} s. What electric charge flows?',current*time,f'Charge Q = It = {current} × {time}.','C')
 if module=='electrostatics':
  if j<2:return q(f'Two point charges of +{a} μC and +{b} μC are {j+1} m apart in vacuum. Use k = 9.00 × 10⁹ N m²/C². Find the force magnitude.',9e9*a*1e-6*b*1e-6/(j+1)**2,'Coulomb’s law: F = k|q₁q₂|/r². Convert μC to 10⁻⁶ C.','N',4)
  if j==2:return q(f'A positive {a} C test charge experiences {a*b} N in a uniform electric field. What is the field magnitude?',b,'Electric field magnitude E = F/|q|.','N/C')
  return q(f'Moving a {a} C charge across a potential difference changes its potential energy by {a*b} J. What is the magnitude of the potential difference?',b,'|ΔV| = |ΔU/q|.','V')
 if module=='current_electricity':
  if j==0:return q(f'A resistor carries {a} A with {a*b} V across it. Find its resistance.',b,'Ohm’s law: R = V/I.','Ω')
  if j==1:return q(f'An appliance draws {a} A from a {10*b} V supply. Find its power.',10*a*b,'Power P = VI.','W')
  if j==2:return q(f'Two resistors of {a} Ω and {b} Ω are connected in series. Find their equivalent resistance.',a+b,'Series resistances add.','Ω')
  return q(f'Two identical {2*a} Ω resistors are connected in parallel. Find their equivalent resistance.',a,'For two equal parallel resistors, Req = R/2.','Ω')
 if module=='magnetism':
  if j%2==0:return q(f'A straight wire segment of length {a} m carries {b} A perpendicular to a 0.20 T uniform magnetic field. Find the magnetic force magnitude.',.2*a*b,'F = BIL sinθ; sin90° = 1.','N',2)
  return q(f'A particle of charge +{a} μC moves at {b} × 10⁴ m/s perpendicular to a 0.50 T magnetic field. Find the magnetic force magnitude.',a*1e-6*b*1e4*.5,'F = |q|vB sinθ; convert μC to C and use sin90° = 1.','N',3)
 if module=='induction':
  turns=10*a;change=.01*b;duration=j+1
  return q(f'A {turns}-turn coil has a uniform magnetic flux change of {change:.2f} Wb per turn in {duration} s. Find the magnitude of its average induced emf.',turns*change/duration,'Faraday’s law for the magnitude: |emf| = N|ΔΦ|/Δt.','V',3)
 if module=='lines_circles':
  if j==0:return q(f'Find the slope through ({k}, {a}) and ({k+2}, {a+2*b}).',b,'Slope = (y₂ − y₁)/(x₂ − x₁).')
  if j==1:return q(f'A circle has equation (x − {a})² + (y + {b})² = {k*k}. Find its radius.',k,'In standard form, (x − h)² + (y − k)² = r².','units')
  if j==2:return q(f'Find the distance between ({k}, {a}) and ({k+3}, {a+4}).',5,'Distance = √(Δx² + Δy²) = √(9 + 16).','units')
  return q(f'Find the x-coordinate of the center of (x − {a})² + (y − {b})² = 25.',a,'Compare with (x − h)² + (y − k)² = r²; the x-coordinate is h.')
 if module=='graph_transforms':
  if j==0:return q(f'Find the x-coordinate of the vertex of y = (x − {a})² + {b}.',a,'The vertex of y = (x − h)² + k is (h, k).')
  if j==1:return q(f'Find the y-coordinate of the vertex of y = −(x + {a})² − {b}.',-b,'The constant outside the square sets the vertex’s y-coordinate.')
  if j==2:return q(f'The graph y = x² is shifted {a} units right and {b} units up. What is y at x = {a}?',b,f'The new equation is y = (x − {a})² + {b}; substitute x = {a}.')
  return q(f'The graph y = {a}x² is reflected across the x-axis. What is its y-value at x = 2?',-4*a,f'Reflection gives y = −{a}x²; evaluate at 2.')
 if module=='polynomials':
  if j==0:return q(f'Find the remainder when f(x) = x² + {a}x + {b} is divided by x − 2.',4+2*a+b,'By the remainder theorem, the remainder is f(2).')
  if j==1:return q(f'For f(x) = (x − {a})(x + {b}), what is the positive zero?',a,f'Setting each factor to zero gives x = {a} and x = −{b}.')
  if j==2:return q(f'What is the coefficient of x in (x + {a})(x + {b})?',a+b,'Expand: x² + (a + b)x + ab.')
  return q(f'If f(x) = {a}x³ − {b}x, find f(−1).',b-a,f'Substitute −1: {a}(−1)³ − {b}(−1).')
 if module=='rational_functions':
  if j==0:return q(f'Which real x-value is excluded from the domain of f(x) = (x + {a})/(x − {b})?',b,'A rational expression is undefined when its denominator is zero.')
  if j==1:return q(f'Find the horizontal asymptote y = L of f(x) = ({a}x + 1)/({b}x − 2). What is L?',Fraction(a,b),'Equal degrees give the ratio of leading coefficients.')
  if j==2:return q(f'For f(x) = (x + {a})/(x − {b}), find f(0).',Fraction(-a,b),f'Substitute x = 0: {a}/(−{b}).')
  return q(f'The graph f(x) = {a}/(x − {b}) has vertical asymptote x = L. Find L.',b,'The denominator is zero at the vertical asymptote; the numerator is nonzero.')
 if module=='exponential_logarithmic':
  if j==0:return q(f'Solve 2^x = {2**a}.',a,f'{2**a} = 2^{a}, so match exponents.')
  if j==1:return q(f'Evaluate log₁₀(10^{a}).',a,'Logarithms and exponentials of the same base are inverse functions.')
  if j==2:return q(f'Solve log₂(x) = {a}.',2**a,f'Convert to exponential form: x = 2^{a}.')
  return q(f'A culture begins with {100*a} cells and doubles every hour. How many cells are there after 3 hours?',800*a,f'N = N₀2³ = {100*a} × 8.','cells')
 if module=='measurement_science':
  if j==0:return q(f'A sample has mass {a*b} g and volume {a} cm³. Find its density.',b,'Density = mass / volume.','g/cm³')
  if j==1:return q(f'Convert {a} milligrams to grams.',a/1000,'1 g = 1000 mg; divide by 1000.','g',3)
  if j==2:return q(f'A measurement is {100+a} cm and the accepted value is 100 cm. Find absolute percent error.',a,'Percent error = |measured − accepted| / accepted × 100%.','%')
  return q(f'Express {a} × 10³ meters in kilometers.',a,'10³ m equals 1 km.','km')
 if module=='kinematics':
  if j==0:return q(f'A cyclist travels in a straight line at constant speed {a} m/s for {b} s. Find the distance.',a*b,'At constant speed, distance = speed × time.','m')
  if j==1:return q(f'An object starts from rest and accelerates uniformly at {a} m/s² for {b} s. Find its final speed.',a*b,'v = u + at, with u = 0.','m/s')
  if j==2:return q(f'An object starts from rest with constant acceleration 2 m/s² for {a} s. Find its displacement.',a*a,'s = ut + ½at² = ½(2)t².','m')
  return q(f'A runner’s displacement is {a*b} m east in {a} s. Find the magnitude of average velocity.',b,'Average velocity = displacement / elapsed time.','m/s')
 if module=='dynamics':
  if j==0:return q(f'A net force accelerates a {a} kg cart at {b} m/s². Find the net force magnitude.',a*b,'Newton’s second law: Fnet = ma.','N')
  if j==1:return q(f'A {a} kg object is near Earth’s surface. Use g = 9.8 m/s². Find its weight.',9.8*a,'Weight W = mg.','N',1)
  if j==2:return q(f'A constant {a} N force moves an object {b} m in the force direction. Find the work done.',a*b,'W = Fd cos0° = Fd.','J')
  return q(f'A {a} kg ball moves at {b} m/s. Find its momentum magnitude.',a*b,'Momentum p = mv.','kg m/s')
 if module=='kitchen_math':
  if j==0:return q(f'A recipe for 4 portions uses {100*a} g of flour. How many grams are needed for 12 portions?',300*a,f'Scaling factor = 12/4 = 3; multiply {100*a} g by 3.','g')
  if j==1:return q(f'A {a} kg bag of rice costs ₱{a*50}. What is the cost of {b} kg at the same unit price?',50*b,'Unit cost = total cost / mass = ₱50/kg.','pesos')
  if j==2:return q(f'Prepared ingredients weigh {100*a} g. Trimming removes 20%. What usable mass remains?',80*a,'Usable yield = initial mass × 0.80.','g')
  return q(f'A food item costs ₱{10*a} to produce. A selling price is set by adding 30% of cost. What is the price?',13*a,'Price = cost × 1.30; this is markup on cost.','pesos')
 if module=='sql_results':
  db=sqlite3.connect(':memory:');db.execute('CREATE TABLE sales (id INTEGER, item TEXT, category TEXT, quantity INTEGER, price INTEGER)')
  rows=[(1,'pen','school',a,10),(2,'book','school',b,50),(3,'apple','food',k,20),(4,'rice','food',2*k,40),(5,'ruler','school',a+2,15)]
  db.executemany('INSERT INTO sales VALUES (?,?,?,?,?)',rows)
  queries=[f'SELECT COUNT(*) FROM sales WHERE quantity > {k}',f'SELECT SUM(quantity) FROM sales WHERE category = \'school\'',f'SELECT MAX(price) FROM sales WHERE id <= {j+2}',f'SELECT SUM(quantity * price) FROM sales WHERE category = \'food\'']
  query=queries[j];answer=db.execute(query).fetchone()[0];db.close()
  table='; '.join(f'({r[0]}, {r[1]}, {r[2]}, {r[3]}, {r[4]})' for r in rows)
  return q(f'Table sales(id, item, category, quantity, price) contains: {table}. What single value does this query return? {query}',answer,'Apply the WHERE filter first, then evaluate the aggregate on the remaining rows.')
 raise ValueError(module)
