import {it,expect} from 'vitest';
import {rowHasCode,normalizeCode} from '../utils/comparison';
it('preserva zeros e usa somente a coluna escolhida',()=>{const row={codigo:'00123',outro:'RP-99'};expect(rowHasCode(row,'codigo','00123')).toBe(true);expect(rowHasCode(row,'codigo','123')).toBe(false);expect(rowHasCode(row,'codigo','RP-99')).toBe(false);expect(normalizeCode(' rp-001 ')).toBe('RP-001');});
