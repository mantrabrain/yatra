# Migration Behavior - Regular vs Force (Re-migration)

## Overview
The migration system now has two distinct modes with different behaviors:

---

## 1. Regular Migration (Default)
**Button:** "Run Migration"

### Behavior:
- **For existing records**: Updates them with latest data
- **For new records**: Inserts them with unique slugs
- **No duplicates**: Same trip/taxonomy is never inserted twice

### Example:
```
First run:  13 tours → 13 trips inserted
Second run: 13 tours → 13 trips updated (still 13 total)
Third run:  13 tours → 13 trips updated (still 13 total)
```

### Use Case:
- **Initial migration** from old system
- **Syncing updates** when you modify tours in old system
- **Safe re-runs** without creating duplicates

---

## 2. Force Migration (Re-migration)
**Button:** "Re-migrate (Force)"

### Behavior:
- **Always inserts new records** (never updates)
- **Creates duplicates** with unique slugs
- **Ignores existing data** completely

### Example:
```
First run:  13 tours → 13 trips inserted (total: 13)
Second run: 13 tours → 13 NEW trips inserted (total: 26)
Third run:  13 tours → 13 NEW trips inserted (total: 39)
```

### Slug Handling:
- Original slug: `everest-base-camp`
- First duplicate: `everest-base-camp-2`
- Second duplicate: `everest-base-camp-3`
- And so on...

### Use Case:
- **Testing migration** multiple times
- **Creating test data** with duplicates
- **Backup scenarios** where you want multiple copies

---

## What Gets Migrated

### Trips:
- ✅ Basic trip data (title, description, pricing, etc.)
- ✅ Gallery images
- ✅ Highlights
- ✅ FAQs
- ✅ Destinations (relationships)
- ✅ Activities (relationships)
- ✅ Categories (relationships)

### Taxonomies:
- ✅ Destinations
- ✅ Activities
- ✅ Trip Categories

---

## Logging

The migration now includes detailed logging. Check `wp-content/debug.log` for:

```
[Yatra Migration] ========================================
[Yatra Migration] Starting Trip Migration
[Yatra Migration] Found 13 tours in wp_posts (old system)
[Yatra Migration] Found 13 trips in yatra_trips (new system)
[Yatra Migration] ========================================
[Yatra Migration] Tour 1: ID=123, Title=Everest Base Camp, Slug=everest-base-camp, Status=publish
...
[Yatra Migration] Regular mode: Updating existing trip ID 45 from old tour ID 123
[Yatra Migration] Successfully updated trip ID 45
...
[Yatra Migration] ========================================
[Yatra Migration] Trip Migration Complete
[Yatra Migration] Migrated: 13, Skipped: 0, Failed: 0
[Yatra Migration] ========================================
```

---

## Important Notes

1. **Regular migration is safe** - Run it as many times as you want, it won't create duplicates
2. **Force migration creates duplicates** - Only use when you specifically want multiple copies
3. **Slugs are unique** - The system ensures no slug conflicts
4. **Relationships are refreshed** - Destinations, activities, and categories are always re-linked

---

## Recommendations

### For Production:
- ✅ Use **Regular Migration** 
- ✅ Run once for initial migration
- ✅ Run again if you update tours in old system

### For Testing:
- ✅ Use **Force Migration** to test with fresh data
- ✅ Delete test trips manually when done
- ✅ Check logs to verify behavior

---

## Troubleshooting

### "Still showing 13 trips after re-migration"
- This is **correct behavior** for Regular Migration
- It updates existing trips, doesn't create new ones
- Use **Force Migration** if you want duplicates

### "Getting duplicate trips"
- This is **correct behavior** for Force Migration
- Each run creates new copies with unique slugs
- Use **Regular Migration** to avoid duplicates

### "Migration failed"
- Check `wp-content/debug.log` for detailed error messages
- Look for database errors or missing data
- Verify old tours exist in `wp_posts` table
