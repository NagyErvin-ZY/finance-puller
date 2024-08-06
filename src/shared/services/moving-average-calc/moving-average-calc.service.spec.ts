import { Test, TestingModule } from '@nestjs/testing';
import { MovingAverageCalcService } from './moving-average-calc.service';

describe('MovingAverageCalcService', () => {
  let service: MovingAverageCalcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovingAverageCalcService],
    }).compile();

    service = module.get<MovingAverageCalcService>(MovingAverageCalcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
