import { expectedReturnOptions, expectedReturnValue } from '@/features/relationships/domain';

describe('client return interval domain',()=>{
  it('accepts only the closed list and maps business default to null',()=>{
    expect(expectedReturnOptions).toEqual([30,60,90,180,365]);
    expect(expectedReturnValue('default')).toBeNull();
    expect(expectedReturnValue('30')).toBe(30);
    expect(expectedReturnValue('365')).toBe(365);
  });

  it('rejects arbitrary values',()=>{
    expect(()=>expectedReturnValue('3')).toThrow('INVALID_EXPECTED_RETURN_DAYS');
    expect(()=>expectedReturnValue('90.5')).toThrow('INVALID_EXPECTED_RETURN_DAYS');
  });
});

