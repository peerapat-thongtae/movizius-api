import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'rating' })
export class Rating {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  @Index()
  max_id: string;

  @Column({ type: 'text', array: true, default: [] })
  ids: string[];

  @Column({ type: 'jsonb' })
  ratings: { imdb_id: string; vote_average: number; vote_count: number }[]; //

  // @Column({ type: 'decimal' })
  // vote_average: number;

  // @Column({ type: 'decimal' })
  // vote_count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
