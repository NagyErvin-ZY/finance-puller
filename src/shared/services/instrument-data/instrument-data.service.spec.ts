import { Test, TestingModule } from '@nestjs/testing';
import { InstrumentDataService } from './instrument-data.service';

describe('InstrumentDataService', () => {
  let service: InstrumentDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InstrumentDataService],
    }).compile();

    service = module.get<InstrumentDataService>(InstrumentDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
