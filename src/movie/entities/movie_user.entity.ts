import { Movie } from './movie.entity';
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

@Entity({ name: 'movie_user' })
@Index(['user_id', 'movie'], { unique: true })
export class MovieUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: string;

  @ManyToOne(() => Movie, (movie) => movie.users)
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  watchlisted_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  watched_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
