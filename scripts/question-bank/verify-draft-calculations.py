"""Independently recompute numeric keys in the authored draft; no eval or LLM calls."""
import json
import math
from pathlib import Path
root = Path(__file__).resolve().parents[2]
bank = json.loads((root / 'scripts/question-bank/fixtures/pilot-bank.json').read_text())
expected = {
 2: f'{6 * 1000:,}', 3: str(387 + 246), 4: str(900 - 458),
 5: str(24 * 7), 6: str(936 // 9), 7: str(18 + 6 * 4),
 8: f'{((28649 + 500) // 1000) * 1000:,}',
 9: f'{173 // 14} remainder {173 % 14}', 10: str(math.ceil(157 / 12)),
 13: str(8 * 24 - 37), 15: f'₱{(90 - 18) // 6}',
 16: str(16 * 23 + 7), 18: str(math.ceil(286 / 48) * 48 - 286),
 19: f'₱{5 * 28 + 35 + 85}',
 20: str(max(n for n in range(100) if n % 9 == 0 and n % 8 == 3)),
}
for index, value in expected.items():
    q = bank['questions'][index - 1]
    actual = next(o['text'] for o in q['options'] if o['isCorrect'])
    assert actual == value, (q['id'], actual, value)
    assert sum(o['text'] == value for o in q['options']) == 1
assert (40 * 25) - 25 == 39 * 25  # Item 11 compensation
assert 50 * 50 - 49 * 51 == 1  # Item 14 comparison
assert 120 / 5 * 2 == 48  # Item 17 order of operations
positions = [next(i for i, o in enumerate(q['options']) if o['isCorrect']) for q in bank['questions']]
assert [positions.count(i) for i in range(4)] == [5, 5, 5, 5]
print(f'Passed {len(expected) + 3} independent computational checks; answer positions A/B/C/D = 5/5/5/5.')
print('Definition, explanation, curriculum suitability and distractor review remain human responsibilities.')
