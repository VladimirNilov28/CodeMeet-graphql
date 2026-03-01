// /user/{id} and /recommendations
export interface User {
    id: string; // uuid
    name: string; // username or GitHub name
    profilePicture: string | null; // URL to the user's profile picture, or null if not available
}

export interface UserProfile {
    userId: string; // uuid
    aboutMe: string; // A brief description about the user
    isOnline: boolean; // Whether the user is currently online
}

export interface UserBio {
    userId: string; // uuid
    techStack: 'Frontend' | 'Backend' | 'Fullstack'; // The user's primary tech stack
    objective: 'Hackathon' | 'Open-Source' | 'Study Buddy' | 'Venting' | 'Mentorship' | 'Networking' | 'Dating'; // The user's objective for using the platform (e.g., "Looking for a mentor", "Seeking project collaborators", etc.)
    indentation: 'Tabs' | 'Spaces'; // The user's preferred code indentation style
    operatingSystem: 'Windows' | 'macOS' | 'Linux'; // The user's preferred operating system for development
}

// helper for GraphQL profile query
export interface FullUser extends User {
    profile: UserProfile;
    bio: UserBio;
}