// src/services/classService.ts
import api from './api';

export interface Organization {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  subscription_type: string;
  max_teachers: number;
  max_students: number;
  status: string;
}

export interface Class {
  id: number;
  organization_id: number | null;
  teacher_id: number;
  name: string;
  description: string;
  subject: string;
  grade_level: string;
  class_code: string;
  status: string;
  created_at: string;
  teacher_name?: string;
  teacher_email?: string;
  organization_name?: string;
  member_count?: number;
  joined_date?: string;
}

export interface ClassMember {
  id: number;
  class_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface Invitation {
  id: number;
  class_id: number;
  invited_email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  token: string;
  expires_at: string;
}

class ClassService {
  // ========== سازمان/مدرسه ==========
  
  async createOrganization(data: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }): Promise<{ success: boolean; organization?: Organization; message?: string }> {
    try {
      const response = await api.post('/classes/organization/create', data);
      return {
        success: true,
        organization: response.data.data.organization,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ایجاد سازمان'
      };
    }
  }

  async getOrganizationMembers(): Promise<{ success: boolean; members?: ClassMember[]; message?: string }> {
    try {
      const response = await api.get('/classes/organization/members');
      return {
        success: true,
        members: response.data.data.members
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اعضا'
      };
    }
  }

  async addMemberToOrganization(email: string, role: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post('/classes/organization/add-member', { email, role });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در اضافه کردن عضو'
      };
    }
  }

  // ========== کلاس‌ها ==========

  // ✅ ایجاد کلاس جدید (با لاگ کامل)
  async createClass(data: {
    name: string;
    description?: string;
    subject?: string;
    grade_level?: string;
  }): Promise<{ success: boolean; class?: Class; message?: string }> {
    try {
      console.log('📤 Creating class with data:', data);
      
      const response = await api.post('/classes/class/create', data);
      
      console.log('📥 Create class response:', response.data);
      
      return {
        success: true,
        class: response.data.data.class,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('❌ Create class error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ایجاد کلاس'
      };
    }
  }

  async getMyClasses(): Promise<{ success: boolean; classes?: Class[]; message?: string }> {
    try {
      const response = await api.get('/classes/class/my-classes');
      return {
        success: true,
        classes: response.data.data.classes
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت کلاس‌ها'
      };
    }
  }

  async getClassById(classId: number): Promise<{ success: boolean; class?: Class; message?: string }> {
    try {
      const response = await api.get(`/classes/class/${classId}`);
      return {
        success: true,
        class: response.data.data.class
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت کلاس'
      };
    }
  }

  async joinClassByCode(code: string): Promise<{ success: boolean; class?: Class; message?: string }> {
    try {
      console.log('📤 Sending join request with code:', code);
      const response = await api.post('/classes/class/join', { code });
      console.log('📥 Join response:', response.data);
      
      return {
        success: true,
        class: response.data.data?.class,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Join class API error:', error);
      console.error('Error response:', error.response?.data);
      
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در پیوستن به کلاس'
      };
    }
  }

  async inviteToClass(classId: number, email: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/classes/class/${classId}/invite`, { email });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در ارسال دعوت‌نامه'
      };
    }
  }

  async acceptInvitation(token: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put('/classes/class/accept-invite', { token });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در پذیرش دعوت‌نامه'
      };
    }
  }

  async removeMember(classId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/classes/class/${classId}/member/${userId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در حذف عضو'
      };
    }
  }

  async getClassMembers(classId: number): Promise<{ success: boolean; members?: ClassMember[]; message?: string }> {
    try {
      const response = await api.get(`/classes/class/${classId}/members`);
      return {
        success: true,
        members: response.data.data.members
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اعضا'
      };
    }
  }

  async addStudentToClass(classId: number, studentEmail: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`📤 Adding student ${studentEmail} to class ${classId}`);
      const response = await api.post(`/classes/class/${classId}/add-member`, {
        email: studentEmail,
        role: 'student'
      });
      console.log('📥 Add student response:', response.data);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error adding student to class:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در اضافه کردن دانش‌آموز به کلاس'
      };
    }
  }

  async leaveClass(classId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post(`/classes/class/${classId}/leave`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در خروج از کلاس'
      };
    }
  }

  async expelStudent(classId: number, studentId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/classes/class/${classId}/member/${studentId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در اخراج دانش‌آموز'
      };
    }
  }

  async getOrganizationFullMembers(): Promise<{ 
    success: boolean; 
    members?: any[]; 
    stats?: any;
    userRole?: string;
    organizationId?: number;
    message?: string;
  }> {
    try {
      const response = await api.get('/classes/organization/full-members');
      return {
        success: true,
        members: response.data.data.members,
        stats: response.data.data.stats,
        userRole: response.data.data.userRole,
        organizationId: response.data.data.organizationId
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در دریافت اعضا'
      };
    }
  }

  async leaveOrganization(organizationId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.post('/classes/organization/leave', { organizationId });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در خروج از سازمان'
      };
    }
  }

  async getMyInvitations(): Promise<{ success: boolean; invitations?: any[]; message?: string }> {
    try {
      const response = await api.get('/classes/my-invitations');
      return { success: true, invitations: response.data.data.invitations };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message };
    }
  }

  async expelTeacher(organizationId: number, teacherId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.delete(`/classes/organization/${organizationId}/teacher/${teacherId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در اخراج معلم'
      };
    }
  }

  async changeMemberRole(organizationId: number, memberId: number, newRole: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.put(`/classes/organization/${organizationId}/member/${memberId}/role`, { newRole });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'خطا در تغییر نقش'
      };
    }
  }
}

export const classService = new ClassService();