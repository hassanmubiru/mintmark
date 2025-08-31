import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { RoleChecker } from '@/components/RoleChecker';
import { TrophyIcon, ShieldIcon, AlertTriangleIcon } from 'lucide-react';

export default function CheckRolesPage() {
  return (
    <>
      <Head>
        <title>Check Your Roles - MintMark</title>
        <meta name="description" content="Check your current roles and permissions" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="container-base">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <TrophyIcon className="w-8 h-8 text-primary-600" />
                  <span className="text-xl font-bold text-gray-900">MintMark</span>
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">Check Roles</span>
              </div>
              
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/organizer" className="text-gray-600 hover:text-gray-900">
                  Organizer
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container-base py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                <ShieldIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Check Your Roles
              </h1>
              <p className="text-gray-600">
                Verify your current permissions and understand why you might not be able to access certain features.
              </p>
            </div>

            {/* Role Checker Component */}
            <RoleChecker />

            {/* Help Section */}
            <div className="mt-8 card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5" />
                  Need Help?
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Can't access organizer features?</h4>
                    <p className="text-gray-600 text-sm">
                      The organizer role must be granted by an admin. If you need organizer access, 
                      contact the system administrator with your wallet address.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">How to get organizer role:</h4>
                    <ol className="list-decimal list-inside text-gray-600 text-sm space-y-1">
                      <li>Contact the system administrator</li>
                      <li>Provide your wallet address</li>
                      <li>Wait for the admin to grant you the organizer role</li>
                      <li>Refresh this page to see your updated roles</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What can organizers do?</h4>
                    <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                      <li>Create and manage events</li>
                      <li>Set event capacity and details</li>
                      <li>Generate QR codes for attendance verification</li>
                      <li>View event analytics and attendee lists</li>
                      <li>Mint attendance badges</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard" className="card hover:shadow-lg transition-shadow">
                <div className="card-body text-center">
                  <TrophyIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <h3 className="font-medium">View Dashboard</h3>
                  <p className="text-sm text-gray-600">See your badges and attendance history</p>
                </div>
              </Link>
              
              <Link href="/" className="card hover:shadow-lg transition-shadow">
                <div className="card-body text-center">
                  <TrophyIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  <h3 className="font-medium">Back to Home</h3>
                  <p className="text-sm text-gray-600">Return to the main page</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
