import { TV } from './tv.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tv_user' })
@Index(['user_id', 'tv'], { unique: true })
export class TVUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: string;

  @ManyToOne(() => TV, (tv) => tv.users)
  @JoinColumn({ name: 'tv_id' })
  tv: TV;

  // @Column({ type: 'decimal' })
  // episode_id: number;

  // @Column({ type: 'decimal' })
  // episode_number: number;

  // @Column({ type: 'decimal' })
  // season_number: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  watchlisted_at: Date | null;

  @Column({ type: 'jsonb', array: false, default: () => "'[]'" })
  episode_watched: {
    episode_id: number;
    episode_number: number;
    season_number: number;
    watched_at: Date | null;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
