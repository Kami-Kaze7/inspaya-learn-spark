interface EnrollmentIntent {
  courseId: string;
  timestamp: number;
}

const STORAGE_KEY = 'pending_course_enrollment';
const EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const enrollmentIntent = {
  set: (courseId: string) => {
    const intent: EnrollmentIntent = {
      courseId,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  },

  get: (): string | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const intent: EnrollmentIntent = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() - intent.timestamp > EXPIRY_TIME) {
        enrollmentIntent.clear();
        return null;
      }

      return intent.courseId;
    } catch {
      enrollmentIntent.clear();
      return null;
    }
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
};
