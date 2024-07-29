import { TVUser } from './tv_user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'tv' })
export class TV {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'boolean', default: false })
  is_anime: boolean;

  @Column({ type: 'date', nullable: true })
  release_date: Date;

  @Column({ type: 'decimal' })
  number_of_seasons: number;

  @Column({ type: 'decimal' })
  number_of_episodes: number;

  @Column({ type: 'decimal', nullable: true })
  vote_average: number;

  @Column({ type: 'decimal', nullable: true })
  vote_count: number;

  @OneToMany(() => TVUser, (tvUser) => tvUser.tv)
  users: TVUser[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
