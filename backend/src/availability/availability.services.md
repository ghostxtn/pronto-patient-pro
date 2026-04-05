### backend/src/availability/availability.service.ts
- Claude added two different kinds of changes:
  1. read-path improvements
  2. write-path behavior changes
- Keep:
  - multi-override subtraction logic
  - interval-based booked-slot filtering
  - helper methods: generateSlotEntries, subtractBlockedRange
- Revert:
  - buildAvailabilityMergePlan
  - rangesOverlap
  - rangesOverlapOrTouch
  - merge-based create/update behavior
- Reason:
  - read-path fixes are aligned with slot truth
  - merge-based write behavior is higher-risk backend behavior change and should not stay in the stabilization pass
- Also fix typing on map/sort callbacks if any of this read-path logic remains