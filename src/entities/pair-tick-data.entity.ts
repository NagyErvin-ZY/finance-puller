//pair tick data entity
import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { ORDER_TYPE } from './enums/pair-tick.enums';
import Pair from './pair.entity';

@Entity({
    synchronize: false,
})
export default class PairTickData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: 'enum',
        enum: ORDER_TYPE,
        default: ORDER_TYPE.NONE_MARKET_FETCH_LATEST_EXECUTION,
    })
    order_type: ORDER_TYPE;
    
    //Very high precision for BTC
    @Column({type: 'decimal', precision: 40, scale: 20})
    price: number;

    @Column({type: 'bigint'})
    quantity: number;

    @Column({unique: true})
    timestamp: Date;

    //Relation to Pair entity
    @ManyToOne(() => Pair)
    pair: Pair;
}