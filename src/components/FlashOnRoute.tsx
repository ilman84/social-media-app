'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function FlashOnRoute() {
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const flash = sessionStorage.getItem('flash');
		if (!flash) return;
		switch (flash) {
			case 'login-success':
				toast.success('Login success', { duration: 4000 });
				break;
			case 'register-success':
				toast.success('Registered successfully', { duration: 4000 });
				break;
			default:
				break;
		}
		sessionStorage.removeItem('flash');
	}, []);

	return null;
}

