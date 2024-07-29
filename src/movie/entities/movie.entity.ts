import { MovieUser } from './movie_user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm';

@Entity({ name: 'movie' })
export class Movie {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'boolean', default: false })
  is_anime: boolean;

  @Column({ type: 'date', nullable: true })
  release_date: Date;

  @OneToMany(() => MovieUser, (movieUser) => movieUser.movie)
  users: MovieUser[];

  @Column({ type: 'decimal', nullable: true })
  vote_average: number;

  @Column({ type: 'decimal', nullable: true })
  vote_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
