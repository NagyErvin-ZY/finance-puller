import { Test, TestingModule } from '@nestjs/testing';
import { MovingAverageController } from './moving-average.controller';

describe('MovingAverageController', () => {
  let controller: MovingAverageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovingAverageController],
    }).compile();

    controller = module.get<MovingAverageController>(MovingAverageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
