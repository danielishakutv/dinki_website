import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Edit3, Star, Scissors, Briefcase, Calendar } from 'lucide-react';

const profileData = {
  tailor: {
    name: 'Dinki Atelier',
    role: 'Master Tailor',
    initials: 'DA',
    color: 'from-gold-400 to-amber-500',
    email: 'hello@dinkiatelier.com',
    phone: '+234 803 456 7890',
    location: 'Victoria Island, Lagos',
    bio: 'Award-winning bespoke tailor specializing in Agbada, Kaftan, and modern African fashion. Over 12 years of experience crafting premium garments.',
    joined: 'November 2025',
    stats: [
      { label: 'Jobs Done', value: '247', icon: Scissors },
      { label: 'Clients', value: '89', icon: User },
      { label: 'Rating', value: '4.9', icon: Star },
      { label: 'Years', value: '12', icon: Briefcase },
    ],
    specialties: ['Agbada', 'Kaftan', 'Ankara', 'Corporate Wear', 'Bridal', 'Embroidery'],
  },
  customer: {
    name: 'Adeola Okafor',
    role: 'Customer',
    initials: 'AO',
    color: 'from-teal-400 to-emerald-500',
    email: 'adeola.okafor@mail.com',
    phone: '+234 816 789 0123',
    location: 'Lekki, Lagos',
    bio: 'Fashion enthusiast who loves bespoke African style. Always looking for the next stunning outfit.',
    joined: 'January 2026',
    stats: [
      { label: 'Orders', value: '15', icon: Scissors },
      { label: 'Tailors', value: '4', icon: User },
      { label: 'Reviews', value: '12', icon: Star },
      { label: 'Since', value: '2026', icon: Calendar },
    ],
    specialties: ['Ankara Dresses', 'Aso-Oke', 'Office Wear', 'Evening Gowns'],
  },
};

export default function Profile({ userRole }) {
  const [editing, setEditing] = useState(false);
  const isTailor = userRole === 'tailor';
  const profile = isTailor ? profileData.tailor : profileData.customer;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Cover + Avatar */}
      <div className="relative bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 rounded-3xl h-40 md:h-48">
        <div className="absolute inset-0 opacity-20 overflow-hidden rounded-3xl">
          <div className="absolute top-4 right-8 w-32 h-32 bg-white/20 rounded-full" />
          <div className="absolute bottom-0 left-12 w-20 h-20 bg-white/15 rounded-full" />
          <div className="absolute top-8 left-1/3 w-16 h-16 bg-white/10 rounded-full" />
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-6 md:left-8">
          <div className="relative">
            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${profile.color} flex items-center justify-center text-white font-heading font-bold text-2xl md:text-3xl ring-4 ring-white shadow-lg`}>
              {profile.initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Camera size={14} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => setEditing(!editing)}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white text-xs font-medium hover:bg-white/30 transition-colors"
        >
          <Edit3 size={14} />
          Edit Profile
        </button>
      </div>

      {/* Name + Info */}
      <div className="pt-14 md:pt-16 px-1">
        <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900">{profile.name}</h1>
        <p className="text-sm text-gold-600 font-medium">{profile.role}</p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-lg">{profile.bio}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.stats.map((stat) => (
          <motion.div
            key={stat.label}
            whileTap={{ scale: 0.97 }}
            className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm"
          >
            <stat.icon size={18} className="text-gold-500 mx-auto mb-1.5" />
            <p className="text-lg md:text-xl font-heading font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <h3 className="px-5 pt-5 pb-3 font-heading font-semibold text-gray-800">Contact Information</h3>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <Mail size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-sm text-gray-700 truncate">{profile.email}</p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <Phone size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Phone</p>
            <p className="text-sm text-gray-700">{profile.phone}</p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <MapPin size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Location</p>
            <p className="text-sm text-gray-700">{profile.location}</p>
          </div>
        </div>
        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center">
            <Calendar size={16} className="text-gold-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Member Since</p>
            <p className="text-sm text-gray-700">{profile.joined}</p>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-heading font-semibold text-gray-800 mb-3">
          {isTailor ? 'Specialties' : 'Style Preferences'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.specialties.map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 rounded-xl bg-gold-50 text-gold-700 text-xs font-medium border border-gold-100"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
