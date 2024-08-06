import { Module } from '@nestjs/common';
import { AdministrationService } from './administration.service';
import { AdministrationController } from './administration.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import Pair from 'src/entities/pair.entity';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Pair])],
  providers: [AdministrationService,ConfigService],
  controllers: [AdministrationController]
})
export class AdministrationModule {}
