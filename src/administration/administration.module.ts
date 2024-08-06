import { Module } from '@nestjs/common';
import { AdministrationService } from './administration.service';
import { AdministrationController } from './administration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Pair from 'src/entities/pair.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pair])],
  providers: [AdministrationService],
  controllers: [AdministrationController]
})
export class AdministrationModule {}
