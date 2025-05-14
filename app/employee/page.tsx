'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useRouter } from 'next/navigation';

// Define a type for the settings data
interface Settings {
  central_latitude: number | null;
  central_longitude: number | null;
  geofence_radius: number | null;
}

const EmployeePage = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    central_latitude: null,
    central_longitude: null,
    geofence_radius: null,
  });
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
    });

    return () => subscription?.unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('settings').select('*').single();

      if (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load application settings.');
      } else if (data) {
        setSettings({
          central_latitude: data.central_latitude,
          central_longitude: data.central_longitude,
          geofence_radius: data.geofence_radius,
        });
      }
    };

    fetchSettings();
  }, []);

  const handleCheckIn = async () => {
    if (!settings.central_latitude || !settings.central_longitude || !settings.geofence_radius) {
      setError('Application settings not loaded. Please try again later.');
      return;
    }

    setIsCheckingIn(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const distance = calculateDistance(
            latitude,
            longitude,
            settings.central_latitude!,
            settings.central_longitude!
          );

          if (distance <= settings.geofence_radius!) {
            const { error: attendanceError } = await supabase.from('attendance').insert({
              user_id: user?.id,
              check_in_time: new Date().toISOString(),
              check_in_latitude: latitude,
              check_in_longitude: longitude,
            });

            if (attendanceError) {
              setError('Failed to record check-in.');
              console.error('Error recording check-in:', attendanceError);
            } else {
              setAttendanceStatus('Checked in successfully!');
              // Optionally, update UI to show check-out button
            }
          } else {
            setError('You are not within the authorized location.');
          }
          setIsCheckingIn(false);
        },
        (error) => {
          setError(`Error getting location: ${error.message}`);
          setIsCheckingIn(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setIsCheckingOut(true);
    setError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // For simplicity, we're not re-validating the location for checkout in this basic example.
          // In a real application, you might want to do so or have different rules.

          // Find the latest check-in record for the user without a check-out time
          const { data, error: fetchError } = await supabase
            .from('attendance')
            .select('id')
            .eq('user_id', user?.id)
            .is('check_out_time', null)
            .order('check_in_time', { ascending: false })
            .limit(1)
            .single();

          if (fetchError) {
            setError('Failed to fetch your last check-in.');
            console.error('Error fetching last check-in:', fetchError);
          } else if (data?.id) {
            const { error: updateError } = await supabase
              .from('attendance')
              .update({
                check_out_time: new Date().toISOString(),
                check_out_latitude: latitude,
                check_out_longitude: longitude,
              })
              .eq('id', data.id);

            if (updateError) {
              setError('Failed to record check-out.');
              console.error('Error recording check-out:', updateError);
            } else {
              setAttendanceStatus('Checked out successfully!');
              // Optionally, update UI to show check-in button
            }
          } else {
            setError('No active check-in found.');
          }
          setIsCheckingOut(false);
        },
        (error) => {
          setError(`Error getting location: ${error.message}`);
          setIsCheckingOut(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setIsCheckingOut(false);
    }
  };

  // Basic Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const toRadians = (degrees: number) => {
    return degrees * Math.PI / 180;
  };

  if (loading) {
    return <p>Loading user session...</p>;
  }

  if (!user) {
    router.push('/login'); // Redirect to login if not authenticated
    return null;
  }

  return (
    <div>
      <h1>Employee Attendance</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {attendanceStatus && <p>{attendanceStatus}</p>}

      {/* Determine whether to show Check-in or Check-out button */}
      {/* This is a very basic implementation - you'll likely need to query the DB for current status */}
      <button onClick={handleCheckIn} disabled={isCheckingIn}>
        {isCheckingIn ? 'Checking in...' : 'Check In'}
      </button>
      <button onClick={handleCheckOut} disabled={isCheckingOut}>
        {isCheckingOut ? 'Checking out...' : 'Check Out'}
      </button>
    </div>
  );
};

export default EmployeePage;