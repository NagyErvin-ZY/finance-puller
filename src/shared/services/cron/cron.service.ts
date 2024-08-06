import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CronJob } from 'cron';
import { IRestClient, restClient } from 'polygon.io';
import { ORDER_TYPE } from 'src/entities/enums/pair-tick.enums';
import PairTickData from 'src/entities/pair-tick-data.entity';
import Pair from 'src/entities/pair.entity';
import { MovingAverageCalcService } from 'src/shared/services/moving-average-calc/moving-average-calc.service';
import { InstrumentDataService } from 'src/shared/services/instrument-data/instrument-data.service';
import { Repository } from 'typeorm';

@Injectable()
export class CronService {
    private jobs: Map<string, CronJob> = new Map();

    constructor(
        private configService: ConfigService,
        private schedulerRegistry: SchedulerRegistry,

    ) {
    }

    startCronJob(
        jobId: string,
        jobFunction: () => void,
        intervalCron: string
    ) {
        if (this.jobs.has(jobId)) {
            throw new ConflictException(`Job for ${jobId} is already running`);
        }

        const job = new CronJob(intervalCron, jobFunction);

        this.schedulerRegistry.addCronJob(jobId, job);
        job.start();
        this.jobs.set(jobId, job);
    }

    stopCronJob(jobId: string) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new NotFoundException(`Job for ${jobId} not found`);
        }

        job.stop();
        this.schedulerRegistry.deleteCronJob(jobId);
        this.jobs.delete(jobId);
    }

    getAllRunningJobs() {
        return Array.from(this.jobs.keys());
    }
}
