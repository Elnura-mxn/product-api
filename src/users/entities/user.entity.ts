import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column({unique: true})
  email: string;

  @Column({nullable: true})
  position: string;
  
  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ name: 'reset_password_token', type: 'varchar', nullable: true })
  @Exclude()
  resetPasswordToken: string | null;

  @Column ({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  @Exclude()
  resetPasswordExpires: Date | null;

  @CreateDateColumn({name: 'created_at'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at'})
  updatedAt: Date;

  @DeleteDateColumn({name: 'deleted_at'})
  deletedAt: Date;

}