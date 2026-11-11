import { describe, expect, it } from 'vitest';
import { parseFertilizer, plotKg } from './barc-fertilizer';

// Shape of BARC's recommendation table (czis.cropzoning.gov.bd), Boro rice near Rajshahi, 11 Nov 2026.
const table = `<table class="table"> <thead class="bg-warning"> <tr> <th>Fertilizer</th> <th>Nutrient Element</th> <th class="text-right">Amount (per 100 decimal)</th> </tr> </thead> <tbody>
<!-- Array ( [0] => stdClass Object ( [name] => Nitrogen ) ) -->
<tr> <th>Urea</th> <td>Nitrogen</td> <td class="text-right"> 139.392 kg </td> </tr>
<tr> <td colspan="3" class="pl-4">or</td> </tr>
<tr> <th>Urea (if DAP is used)</th> <td>Nitrogen with DAP</td> <td class="text-right"> 133.929 kg </td> </tr>
<tr> <th>TSP</th> <td>Phosphorus</td> <td class="text-right"> 15.176 kg </td> </tr>
<tr> <td colspan="3" class="pl-4">or</td> </tr>
<tr> <th>DAP</th> <td>Phosphorus</td> <td class="text-right"> 15.176 kg </td> </tr>
<tr> <th>MoP</th> <td>Potassium</td> <td class="text-right"> 34.533 kg </td> </tr>
<tr> <th>Gypsum</th> <td>Sulfur</td> <td class="text-right"> 26.979 kg </td> </tr>
<tr> <th>Zinc Sulphate (M)</th> <td>Zinc</td> <td class="text-right"> 1.728 kg </td> </tr>
<tr> <th>Boric Acid</th> <td>Boron</td> <td class="text-right"> 850 g </td> </tr>
<tr> <td colspan="3" class="pl-4"> <b>* Note: </b> <!-- min 1 gm --> </td> </tr>
<tr> <td colspan="3" class="pl-4"> * Before transplanting Boro rice, apply all TSP as basal. </td> </tr>
</tbody></table>`;

describe('BARC fertiliser table', () => {
  it('reads each fertiliser with its amount and marks the "or" alternatives', () => {
    const { items, notes } = parseFertilizer(table);
    expect(items.filter((i) => !i.alt).map((i) => [i.name, i.kg])).toEqual([
      ['Urea', 139.392],
      ['TSP', 15.176],
      ['MoP', 34.533],
      ['Gypsum', 26.979],
      ['Zinc Sulphate (M)', 1.728],
      ['Boric Acid', 0.85],
    ]);
    expect(items.filter((i) => i.alt).map((i) => i.name)).toEqual(['Urea (if DAP is used)', 'DAP']);
    expect(notes).toEqual(['Before transplanting Boro rice, apply all TSP as basal.']);
  });
  it('is empty where BARC has no recommendation', () => {
    expect(parseFertilizer('<html><body>No data</body></html>')).toEqual({ items: [], notes: [] });
  });
  it('scales per 100 decimals to the plot: 1 ha is 247.105 decimals', () => {
    expect(plotKg(100, 1)).toBeCloseTo(247.105);
    expect(plotKg(90.321, 0.1337803776)).toBeCloseTo(29.86, 1); // one bigha of 33 decimals
  });
});
