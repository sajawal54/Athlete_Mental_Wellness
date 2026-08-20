import { useCallback, useEffect, useState } from "react";
import {
  ShieldExclamationIcon,
  PhoneIcon,
  UserGroupIcon,
  HeartIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ClockIcon,
  LifebuoyIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import { emergencyService } from "../services/emergencySupportService";

const INITIAL_FORM = {
  name: "",
  contact: "",
  reason: "",
  urgency: "normal",
  message: "",
};

const EmergencySupport = () => {
  const [contacts, setContacts] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [crisisInfo, setCrisisInfo] = useState([]);
  const [breathingExercises, setBreathingExercises] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState("");

  const [formData, setFormData] = useState(INITIAL_FORM);

  // Selected counselor for callback/support request
  const [selectedCounselor, setSelectedCounselor] = useState(null);

  const loadEmergencyData = useCallback(async () => {
    setError("");

    const isInitialLoad =
      contacts.length === 0 &&
      counselors.length === 0 &&
      crisisInfo.length === 0 &&
      breathingExercises.length === 0;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const results = await Promise.allSettled([
        emergencyService.getContacts("pakistan"),
        emergencyService.getCounselors(),
        emergencyService.getCrisisInformation(),
        emergencyService.getBreathingExercises(),
      ]);

      const [
        contactsResult,
        counselorsResult,
        crisisResult,
        breathingResult,
      ] = results;

      if (contactsResult.status === "fulfilled") {
        setContacts(contactsResult.value?.contacts || []);
      }

      if (counselorsResult.status === "fulfilled") {
        setCounselors(counselorsResult.value?.counselors || []);
      }

      if (crisisResult.status === "fulfilled") {
        setCrisisInfo(crisisResult.value?.information || []);
      }

      if (breathingResult.status === "fulfilled") {
        setBreathingExercises(
          breathingResult.value?.exercises || []
        );
      }

      const failedServices = results.filter(
        (result) => result.status === "rejected"
      ).length;

      if (failedServices === results.length) {
        setError(
          "Emergency support services could not be loaded. Please try again."
        );
      } else if (failedServices > 0) {
        setError(
          "Some emergency support information could not be loaded. Available services are still shown below."
        );
      }
    } catch {
      setError(
        "Something went wrong while loading emergency support."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    contacts.length,
    counselors.length,
    crisisInfo.length,
    breathingExercises.length,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadEmergencyData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadEmergencyData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (callbackSuccess) {
      setCallbackSuccess("");
    }

    if (error) {
      setError("");
    }
  };

  /**
   * Opens callback form for a specific counselor.
   *
   * The counselor object is stored locally so we can send
   * counselor_id to the backend when the request is submitted.
   *
   * The backend should use counselor_id to find the counselor's
   * trusted email address and send the appointment/request email.
   */
  const handleCounselorSupport = (counselor) => {
    setSelectedCounselor(counselor);

    setFormData({
      ...INITIAL_FORM,
      reason: `I would like support from ${counselor.name}.`,
      message: counselor.specialization
        ? `Counselor specialization: ${counselor.specialization}`
        : "",
    });

    setCallbackSuccess("");
    setError("");
    setShowCallbackForm(true);

    window.setTimeout(() => {
      document
        .getElementById("callback-request-section")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  /**
   * Opens a general callback form.
   * No specific counselor is selected in this case.
   */
  const handleGeneralCallback = () => {
    setSelectedCounselor(null);
    setFormData(INITIAL_FORM);
    setCallbackSuccess("");
    setError("");
    setShowCallbackForm((value) => !value);
  };

  const handleCallbackSubmit = async (event) => {
    event.preventDefault();

    setCallbackLoading(true);
    setCallbackSuccess("");
    setError("");

    try {
      /*
       * IMPORTANT:
       *
       * We send counselor_id instead of trusting counselor_email
       * from the frontend.
       *
       * Backend should:
       * 1. Find counselor using counselor_id.
       * 2. Read counselor.email from database.
       * 3. Create/save callback request.
       * 4. Send email to that counselor.
       *
       * User information:
       * - name
       * - contact
       * - reason
       * - urgency
       * - message
       */
      const requestData = {
        ...formData,
        counselor_id: selectedCounselor?.id || null,
      };

      const response =
        await emergencyService.createCallbackRequest(requestData);

      if (response?.success) {
        setCallbackSuccess(
          selectedCounselor
            ? `Your support request has been submitted successfully to ${selectedCounselor.name}. The counselor will contact you according to the request details.`
            : "Your callback request has been submitted successfully. A counselor will contact you according to the request details."
        );

        setFormData(INITIAL_FORM);
        setSelectedCounselor(null);
        setShowCallbackForm(false);

        window.setTimeout(() => {
          document
            .getElementById("callback-request-section")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
        }, 50);
      } else {
        setError(
          response?.message ||
            "Unable to submit your callback request. Please try again."
        );
      }
    } catch (err) {
      const validationErrors = err?.response?.data?.errors;

      if (validationErrors) {
        setError(
          "Please check your name, contact information, and reason before submitting."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            "Unable to submit your callback request. Please try again."
        );
      }
    } finally {
      setCallbackLoading(false);
    }
  };

  const handleRetry = () => {
    loadEmergencyData();
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 rounded-3xl bg-rose-50 p-5">
            <ShieldExclamationIcon className="h-10 w-10 animate-pulse text-rose-600" />
          </div>

          <h2 className="text-lg font-black text-slate-900">
            Loading Emergency Support
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Preparing your emergency resources...
          </p>

          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-400">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Please wait
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-4xl border border-rose-200 bg-linear-to-br from-rose-50 via-white to-orange-50 p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-100/60 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-orange-100/50 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-100 shadow-sm">
                <ShieldExclamationIcon className="h-8 w-8 text-rose-600" />
              </div>

              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-rose-700">
                  <LifebuoyIcon className="h-3.5 w-3.5" />
                  Emergency Support
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  You do not have to handle a crisis alone.
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Access emergency contacts, counselor support,
                  crisis information, and a short breathing exercise
                  from one place.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRetry}
              disabled={refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />

              {refreshing ? "Refreshing..." : "Refresh Support"}
            </button>
          </div>

          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Emergency Contacts
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {contacts.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Counselors
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {counselors.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Quick Exercises
              </p>

              <p className="mt-1 text-2xl font-black text-slate-900">
                {breathingExercises.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CRISIS WARNING */}
      <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-100 p-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>

          <div>
            <h2 className="font-black text-red-950">
              Immediate danger?
            </h2>

            <p className="mt-1 text-sm leading-6 text-red-800">
              If you or someone else is in immediate danger, contact
              local emergency services or go to the nearest
              emergency department now. Do not wait for a callback
              request.
            </p>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-amber-600" />

          <div className="flex-1">
            <p className="text-sm font-semibold leading-6 text-amber-800">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              disabled={refreshing}
              className="mt-2 inline-flex items-center gap-1 text-xs font-black text-amber-700 underline disabled:opacity-50"
            >
              Try again
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {callbackSuccess && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircleIcon className="h-6 w-6 shrink-0 text-emerald-600" />

          <p className="text-sm font-semibold leading-6 text-emerald-800">
            {callbackSuccess}
          </p>
        </div>
      )}

      {/* EMERGENCY CONTACTS */}
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5">
              <PhoneIcon className="h-5 w-5 text-rose-600" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Emergency Contacts
              </h2>

              <p className="text-sm text-slate-500">
                Region-specific emergency services and support.
              </p>
            </div>
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <PhoneIcon className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              No emergency contacts are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {contacts.map((contact) => (
              <article
                key={contact.id}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
                    <PhoneIcon className="h-6 w-6 text-rose-600" />
                  </div>

                  {contact.region && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500">
                      {contact.region}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-lg font-black text-slate-950">
                  {contact.name}
                </h3>

                {contact.description && (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {contact.description}
                  </p>
                )}

                {contact.phone && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700">
                    <PhoneIcon className="h-4 w-4 text-slate-400" />
                    {contact.phone}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-rose-700"
                    >
                      <PhoneIcon className="h-4 w-4" />
                      Call Now
                    </a>
                  )}

                  {contact.website_url && (
                    <a
                      href={contact.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      <GlobeAltIcon className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CRISIS INFORMATION */}
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Crisis Information
              </h2>

              <p className="text-sm text-slate-500">
                Important guidance for difficult situations.
              </p>
            </div>
          </div>
        </div>

        {crisisInfo.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              No crisis information is currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {crisisInfo.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-black text-amber-950">
                  {item.title}
                </h3>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-amber-800">
                  {item.content}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* COUNSELORS */}
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5">
              <UserGroupIcon className="h-5 w-5 text-indigo-600" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Counselor Support
              </h2>

              <p className="text-sm text-slate-500">
                Request support from an available counselor.
              </p>
            </div>
          </div>
        </div>

        {counselors.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <UserGroupIcon className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              No counselors are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {counselors.map((counselor) => (
              <article
                key={counselor.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                      <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                    </div>

                    <div>
                      <h3 className="font-black text-slate-950">
                        {counselor.name}
                      </h3>

                      {counselor.specialization && (
                        <p className="mt-0.5 text-xs font-bold text-indigo-600">
                          {counselor.specialization}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                    Available
                  </span>
                </div>

                {counselor.bio && (
                  <p className="mt-5 text-sm leading-6 text-slate-600">
                    {counselor.bio}
                  </p>
                )}

                {counselor.availability && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
                    <ClockIcon className="h-4 w-4 text-slate-400" />

                    <span className="text-xs font-bold text-slate-600">
                      {counselor.availability}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleCounselorSupport(counselor)
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
                >
                  Request Support
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CALLBACK */}
      <section
        id="callback-request-section"
        className="scroll-mt-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2.5">
                <HeartIcon className="h-5 w-5 text-indigo-600" />
              </div>

              <h2 className="text-xl font-black text-slate-950">
                Request a Callback
              </h2>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Ask a counselor to contact you when you need additional
              support. Your request will be securely recorded in the
              system.
            </p>

            {selectedCounselor && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5">
                <UserGroupIcon className="h-4 w-4 text-indigo-600" />

                <span className="text-xs font-bold text-indigo-700">
                  Requesting support from{" "}
                  <span className="font-black">
                    {selectedCounselor.name}
                  </span>
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleGeneralCallback}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-xs font-black text-white transition hover:bg-indigo-700"
          >
            {showCallbackForm ? "Close Form" : "Request Callback"}
          </button>
        </div>

        {showCallbackForm && (
          <form
            onSubmit={handleCallbackSubmit}
            className="mt-7 space-y-5 border-t border-slate-100 pt-7"
          >
            {/* SELECTED COUNSELOR */}
            {selectedCounselor && (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2">
                    <UserGroupIcon className="h-5 w-5 text-indigo-600" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                      Selected Counselor
                    </p>

                    <p className="mt-1 text-sm font-black text-indigo-950">
                      {selectedCounselor.name}
                    </p>

                    {selectedCounselor.specialization && (
                      <p className="mt-1 text-xs font-semibold text-indigo-600">
                        {selectedCounselor.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="callback-name"
                  className="mb-2 block text-xs font-black text-slate-700"
                >
                  Name
                </label>

                <input
                  id="callback-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="callback-contact"
                  className="mb-2 block text-xs font-black text-slate-700"
                >
                  Contact Information
                </label>

                <input
                  id="callback-contact"
                  name="contact"
                  type="text"
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                  autoComplete="tel"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  placeholder="Phone number or email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="callback-reason"
                className="mb-2 block text-xs font-black text-slate-700"
              >
                Reason for Support
              </label>

              <input
                id="callback-reason"
                name="reason"
                type="text"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                placeholder="What kind of support do you need?"
              />
            </div>

            <div>
              <label
                htmlFor="callback-urgency"
                className="mb-2 block text-xs font-black text-slate-700"
              >
                Urgency
              </label>

              <select
                id="callback-urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="immediate">Immediate</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="callback-message"
                className="mb-2 block text-xs font-black text-slate-700"
              >
                Additional Message
              </label>

              <textarea
                id="callback-message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                placeholder="Anything else you would like the counselor to know?"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-400">
                {selectedCounselor
                  ? `Your request will be sent securely to ${selectedCounselor.name} through the application backend.`
                  : "Your information is sent securely to the application backend."}
              </p>

              <button
                type="submit"
                disabled={callbackLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {callbackLoading && (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                )}

                {callbackLoading
                  ? "Submitting..."
                  : "Submit Callback Request"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* BREATHING EXERCISES */}
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <HeartIcon className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-950">
                Quick Breathing Exercise
              </h2>

              <p className="text-sm text-slate-500">
                A short guided activity you can use without leaving
                this page.
              </p>
            </div>
          </div>
        </div>

        {breathingExercises.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <HeartIcon className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              No breathing exercises are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {breathingExercises.map((exercise) => (
              <article
                key={exercise.id}
                className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <HeartIcon className="h-6 w-6 text-emerald-600" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        {exercise.title}
                      </h3>

                      <p className="mt-1 text-xs font-black uppercase tracking-wide text-emerald-600">
                        {exercise.duration_seconds} seconds
                      </p>
                    </div>
                  </div>
                </div>

                {exercise.description && (
                  <p className="mt-5 text-sm leading-6 text-slate-600">
                    {exercise.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                    <p className="text-[10px] font-black tracking-wide text-slate-400">
                      INHALE
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900">
                      {exercise.inhale_seconds}s
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                    <p className="text-[10px] font-black tracking-wide text-slate-400">
                      HOLD
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900">
                      {exercise.hold_seconds}s
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
                    <p className="text-[10px] font-black tracking-wide text-slate-400">
                      EXHALE
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900">
                      {exercise.exhale_seconds}s
                    </p>
                  </div>
                </div>

                {exercise.instructions && (
                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-white/80 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                      Instructions
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-emerald-900">
                      {exercise.instructions}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* FOOTER SAFETY NOTE */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-slate-500" />

          <p className="text-xs leading-6 text-slate-500">
            Emergency Support provides access to support information
            and connection options. It is not a replacement for
            emergency medical services or professional crisis care.
            If there is immediate danger, contact your local emergency
            service directly.
          </p>
        </div>
      </section>
    </div>
  );
};

export default EmergencySupport;