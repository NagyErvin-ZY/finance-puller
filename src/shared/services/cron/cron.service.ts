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
import { Observable, of, throwError } from 'rxjs';

@Injectable()
export class CronService {
    private jobs: Map<string, CronJob> = new Map();

    constructor(
        private configService: ConfigService,
        private schedulerRegistry: SchedulerRegistry,
    ) { }

    /**
     * Starts a new cron job.
     * @param {string} jobId - The unique identifier for the job.
     * @param {() => void} jobFunction - The function to be executed by the cron job.
     * @param {string} intervalCron - The cron interval string.
     * @throws {ConflictException} - If a job with the same ID is already running.
     */
    startCronJob(
        jobId: string,
        jobFunction: () => void,
        intervalCron: string
    ): Observable<void> {
        if (this.jobs.has(jobId)) {
            return throwError(() => new ConflictException(`Job for ${jobId} is already running`));
        }

        const job = new CronJob(intervalCron, jobFunction);

        this.schedulerRegistry.addCronJob(jobId, job);
        job.start();
        this.jobs.set(jobId, job);
        return of(undefined);
    }

    /**
     * Stops a running cron job.
     * @param {string} jobId - The unique identifier for the job.
     * @throws {NotFoundException} - If no job with the given ID is found.
     */
    stopCronJob(jobId: string): Observable<void> {
        const job = this.jobs.get(jobId);
        if (!job) {
            return throwError(() => new NotFoundException(`Job for ${jobId} not found`));
        }

        job.stop();
        this.schedulerRegistry.deleteCronJob(jobId);
        this.jobs.delete(jobId);
        return of(undefined);
    }

    /**
     * Retrieves all running cron jobs.
     * @returns {string[]} - An array of job IDs for all running jobs.
     */
    getAllRunningJobs(): Observable<string[]> {
        return of(Array.from(this.jobs.keys()));
    }
}