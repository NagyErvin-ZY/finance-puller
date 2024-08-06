import { Test, TestingModule } from '@nestjs/testing';
import { MovingAverageService } from './moving-average.service';

describe('MovingAverageService', () => {
  let service: MovingAverageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovingAverageService],
    }).compile();

    service = module.get<MovingAverageService>(MovingAverageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
