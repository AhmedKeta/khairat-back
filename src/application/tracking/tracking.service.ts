import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as geoip from 'geoip-lite';
import { UserTrackingEntity } from '../../infrastructure/database/entities/user-tracking.entity';
import {
  CreateVisitDto,
  normalizeCreateVisitDto,
  type NormalizedVisitInput,
} from './dto/create-visit.dto';
import { FindTrackingVisitsDto } from './dto/find-tracking-visits.dto';

export type TrackingVisitRow = UserTrackingEntity & {
  user?: { id: string; fullName: string; email: string } | null;
};

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(UserTrackingEntity)
    private readonly trackingRepository: Repository<UserTrackingEntity>,
  ) {}

  async create(
    dto: CreateVisitDto,
    opts: { ipFromRequest: string | null; userAgentHeader: string | null },
  ): Promise<UserTrackingEntity> {
    const n = normalizeCreateVisitDto(dto);
    const ipAddress = n.ipAddress || opts.ipFromRequest;
    let country = n.country;
    let location = n.location;

    if ((!country || !location) && ipAddress) {
      const geo = this.lookupGeo(ipAddress);
      if (geo) {
        if (!country) country = geo.country;
        if (!location) location = geo.location;
      }
    }

    const merged: NormalizedVisitInput = {
      ...n,
      country: country || null,
      location: location || null,
    };

    if (merged.guestId?.trim()) {
      const previous = await this.findLatestAttributionByGuestId(merged.guestId.trim());
      if (previous) {
        const keys: (keyof NormalizedVisitInput)[] = [
          'utmSource',
          'utmMedium',
          'utmCampaign',
          'utmTerm',
          'utmContent',
          'referrer',
          'path',
          'country',
          'location',
        ];
        for (const key of keys) {
          const cur = merged[key];
          const prev = previous[key];
          if ((cur === undefined || cur === null || cur === '') && prev) {
            (merged as Record<string, unknown>)[key] = prev;
          }
        }
      }
    }

    const entity = this.trackingRepository.create({
      guestId: merged.guestId?.trim() || null,
      utmSource: merged.utmSource || null,
      utmMedium: merged.utmMedium || null,
      utmCampaign: merged.utmCampaign || null,
      utmTerm: merged.utmTerm || null,
      utmContent: merged.utmContent || null,
      path: merged.path || null,
      referrer: merged.referrer || null,
      ipAddress: ipAddress || null,
      userAgent: merged.userAgent || opts.userAgentHeader || null,
      country: merged.country || null,
      location: merged.location || null,
    });

    return this.trackingRepository.save(entity);
  }

  async findLatestByGuestId(
    guestId: string,
  ): Promise<Pick<UserTrackingEntity, 'id' | 'country' | 'location'> | null> {
    if (!guestId?.trim()) return null;
    return this.trackingRepository.findOne({
      where: { guestId: guestId.trim() },
      order: { createdAt: 'DESC' },
      select: ['id', 'country', 'location'],
    });
  }

  async findLatestAttributionByGuestId(
    guestId: string,
  ): Promise<Pick<
    UserTrackingEntity,
    | 'utmSource'
    | 'utmMedium'
    | 'utmCampaign'
    | 'utmTerm'
    | 'utmContent'
    | 'referrer'
    | 'path'
    | 'country'
    | 'location'
  > | null> {
    if (!guestId?.trim()) return null;
    return this.trackingRepository.findOne({
      where: { guestId: guestId.trim() },
      order: { createdAt: 'DESC' },
      select: [
        'utmSource',
        'utmMedium',
        'utmCampaign',
        'utmTerm',
        'utmContent',
        'referrer',
        'path',
        'country',
        'location',
      ],
    });
  }

  async linkGuestToUser(guestId: string, userId: string): Promise<void> {
    if (!guestId?.trim() || !userId) return;
    await this.trackingRepository
      .createQueryBuilder()
      .update(UserTrackingEntity)
      .set({ userId })
      .where('guest_id = :guestId', { guestId: guestId.trim() })
      .andWhere('user_id IS NULL')
      .execute();
  }

  async linkVisitToUser(visitId: string, userId: string): Promise<void> {
    if (!visitId || !userId) return;
    await this.trackingRepository
      .createQueryBuilder()
      .update(UserTrackingEntity)
      .set({ userId })
      .where('id = :visitId', { visitId })
      .andWhere('user_id IS NULL')
      .execute();
  }

  async findVisitById(id: string): Promise<UserTrackingEntity | null> {
    return this.trackingRepository.findOne({ where: { id } });
  }

  async assertVisitExists(id: string): Promise<UserTrackingEntity> {
    const row = await this.findVisitById(id);
    if (!row) throw new NotFoundException('Tracking visit not found');
    return row;
  }

  async findVisitsForAdmin(query: FindTrackingVisitsDto): Promise<{
    data: TrackingVisitRow[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    const limit = query.limit ?? 50;
    const qb = this.trackingRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'user')
      .orderBy('t.createdAt', 'DESC')
      .addOrderBy('t.id', 'DESC');

    if (query.cursor) {
      const [cursorDate, cursorId] = query.cursor.split('|');
      if (cursorId) {
        qb.andWhere(
          '(t.createdAt < :cursorDate OR (t.createdAt = :cursorDate AND t.id < :cursorId))',
          {
            cursorDate: new Date(cursorDate),
            cursorId,
          },
        );
      } else {
        qb.andWhere('t.createdAt < :cursorDate', { cursorDate: new Date(cursorDate) });
      }
    }

    if (query.guestId?.trim()) {
      qb.andWhere('t.guestId = :guestId', { guestId: query.guestId.trim() });
    }
    if (query.userId) {
      qb.andWhere('t.userId = :userId', { userId: query.userId });
    }

    const rows = await qb.take(limit + 1).getMany();
    const hasMore = rows.length > limit;
    const data = (hasMore ? rows.slice(0, limit) : rows) as TrackingVisitRow[];
    const nextCursor =
      hasMore && data.length > 0
        ? `${data[data.length - 1].createdAt.toISOString()}|${data[data.length - 1].id}`
        : null;

    return { data, hasMore, nextCursor };
  }

  async getAnalytics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const visitsOverTime = await this.trackingRepository
      .createQueryBuilder('t')
      .select("TO_CHAR(t.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('t.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy("TO_CHAR(t.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const trafficSources = await this.trackingRepository
      .createQueryBuilder('t')
      .select('t.utmSource', 'name')
      .addSelect('COUNT(*)', 'value')
      .where('t.utmSource IS NOT NULL')
      .groupBy('t.utmSource')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    const trafficMediums = await this.trackingRepository
      .createQueryBuilder('t')
      .select('t.utmMedium', 'name')
      .addSelect('COUNT(*)', 'value')
      .where('t.utmMedium IS NOT NULL')
      .groupBy('t.utmMedium')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    const topCampaigns = await this.trackingRepository
      .createQueryBuilder('t')
      .select('t.utmCampaign', 'name')
      .addSelect('COUNT(*)', 'value')
      .where('t.utmCampaign IS NOT NULL')
      .groupBy('t.utmCampaign')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    const referrers = await this.trackingRepository
      .createQueryBuilder('t')
      .select('t.referrer', 'name')
      .addSelect('COUNT(*)', 'value')
      .where('t.referrer IS NOT NULL')
      .groupBy('t.referrer')
      .orderBy('value', 'DESC')
      .limit(10)
      .getRawMany();

    const topCountries = await this.trackingRepository
      .createQueryBuilder('t')
      .select('t.country', 'name')
      .addSelect('COUNT(*)', 'value')
      .where("t.country IS NOT NULL AND t.country <> ''")
      .groupBy('t.country')
      .orderBy('value', 'DESC')
      .limit(50)
      .getRawMany();

    const topLocations = await this.trackingRepository
      .createQueryBuilder('t')
      .select('t.country', 'country')
      .addSelect('t.location', 'location')
      .addSelect('COUNT(*)', 'value')
      .where("t.location IS NOT NULL AND t.location <> ''")
      .groupBy('t.country')
      .addGroupBy('t.location')
      .orderBy('value', 'DESC')
      .getRawMany();

    return {
      visitsOverTime,
      trafficSources,
      trafficMediums,
      topCampaigns,
      referrers,
      topCountries,
      topLocations,
    };
  }

  private lookupGeo(ipAddress: string): { country: string; location: string } | null {
    try {
      const cleanIp = ipAddress.replace(/^::ffff:/, '').trim();
      if (
        cleanIp === '127.0.0.1' ||
        cleanIp === 'localhost' ||
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(cleanIp)
      ) {
        return { country: 'Local', location: 'Local' };
      }
      const loc = geoip.lookup(cleanIp);
      if (!loc) return null;
      const location = [loc.city, loc.region].filter(Boolean).join(', ') || loc.country || '';
      return {
        country: loc.country || '',
        location: location || loc.country || '',
      };
    } catch (e) {
      this.logger.warn(`Geo lookup failed: ${(e as Error).message}`);
      return null;
    }
  }
}
