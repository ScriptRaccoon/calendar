// global variables

let mode = "view";
let currentEvent = null;
let events;
let firstLoad = true;
let weekOffset = 0;
let readyToTrash = false;

const slotHeight = 30;

const dateOptions = { month: "2-digit", day: "2-digit", year: "numeric" };
let weekStart, weekEnd;

// setup calendar

$(() => {
    setupCalendar();
});

function setupCalendar() {
    $("#calendar > *").each(function () {
        const dayIndex = parseInt($(this).attr("data-dayIndex"));
        const isDay = $(this).hasClass("day");
        const header = $("<div></div>").addClass("columnHeader");
        const slots = $("<div></div>").addClass("slots");
        if (isDay) {
            const name = $(this).attr("data-name");
            header.text(name);
            slots.attr("data-dayIndex", dayIndex);
            $("<div></div>").addClass("dayDisplay").appendTo(header).text("01.01.");
        }
        for (let hour = 0; hour < 24; hour++) {
            const slot = $("<div></div>").attr("data-hour", hour).appendTo(slots);
            if (isDay) {
                slot.addClass("slot")
                    .attr("data-dayIndex", dayIndex)
                    .click(clickSlot)
                    .hover(hoverOverSlot, hoverOutSlot);
            } else {
                slot.addClass("time").text(`${hour}:00 - ${hour + 1}:00`);
            }
        }
        $(this).append(header).append(slots);
    });
    getCurrentWeek();
    loadEvents();
    showCurrentDay();
}

// slot functions

function hoverOverSlot() {
    const hour = $(this).attr("data-hour");
    $(`.time[data-hour=${hour}]`).addClass("currentTime");
}

function hoverOutSlot() {
    $(".time").removeClass("currentTime");
}

function clickSlot() {
    if (mode != "view") return;
    const slot = $(this);
    const hour = slot.attr("data-hour");
    const start = hour.padStart(2, "0") + ":00";
    const end = ((parseInt(hour) + 1) % 24).toString().padStart(2, "0") + ":00";
    let dayIndex = parseInt(slot.attr("data-dayIndex"));
    const date = dateString(
        new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000)
    );
    const id = generateId();
    currentEvent = { start, end, date, dayIndex, id };
    mode = "create";
    openModal();
}

// modal functions

function openModal() {
    const modalTitle = mode == "edit" ? "Update your event" : "Create a new event";
    $("#modalTitle").text(modalTitle);
    $("#eventDate").val(currentEvent.date);
    $("#eventStart").val(currentEvent.start);
    $("#eventEnd").val(currentEvent.end);
    if (mode == "edit") {
        $("#submitButton").val("Update");
        $("#deleteButton, #copyButton").show();
        $("#eventTitle").val(currentEvent.title);
        $("#eventDescription").val(currentEvent.description);
        $(`.color[data-color=${currentEvent.color}]`).addClass("active");
    } else if (mode == "create") {
        $("#submitButton").val("Create");
        $("#deleteButton, #copyButton").hide();
        $(".color").removeClass("active");
        $(".color[data-color=red]").addClass("active");
        $("#eventTitle").val("");
        $("#eventDescription").val("");
    } else if (mode == "copy") {
        $("#submitButton").val("Create");
        $("#deleteButton, #copyButton").hide();
        $("#eventTitle").val(`Kopie von ${currentEvent.title}`);
        $("#eventDescription").val(currentEvent.description);
        $(`.color[data-color=${currentEvent.color}]`).addClass("active");
    }
    $("#eventModal").fadeIn("fast");
    $("#eventTitle").focus();
    $("#calendar").addClass("opaque");
}

function closeModal() {
    $("#eventModal").hide();
    $("#errors").text("");
    $("#calendar").removeClass("opaque");
    mode = "view";
    currentEvent = null;
}

$("#cancelButton").click(closeModal);

$("#addButton").click(() => {
    if (mode != "view") return;
    mode = "create";
    const now = new Date();
    currentEvent = {
        start: "12:00",
        end: "13:00",
        date: dateString(now),
        dayIndex: getDayIndex(now),
    };
    openModal();
});

$("#copyButton").click(() => {
    if (mode != "edit") return;
    const copy = { ...currentEvent };
    copy.id = generateId();
    closeModal();
    mode = "copy";
    currentEvent = copy;
    openModal();
});

// event functions

function loadEvents() {
    $(".event").remove();
    if (firstLoad) events = JSON.parse(localStorage.getItem("events"));
    firstLoad = false;
    if (events) {
        for (let i = 0; i < 7; i++) {
            const date = dateString(
                new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
            );
            if (events[date]) {
                for (const event of Object.values(events[date])) {
                    showEvent(event);
                }
            }
        }
    } else {
        events = {};
    }
}

$("#eventModal").submit((e) => {
    e.preventDefault();
    const newTitle = $("#eventTitle").val();
    if (newTitle.length == 0) {
        $("#errors").text("Please choose a title.");
        return;
    }
    const newStart = $("#eventStart").val();
    const newEnd = $("#eventEnd").val();
    const newDate = $("#eventDate").val();
    if (events[newDate]) {
        const collidingEvent = Object.values(events[newDate]).find(
            (ev) => ev.id != currentEvent.id && ev.end > newStart && ev.start < newEnd
        );
        if (collidingEvent) {
            $("#errors").html(
                `This collides with the event '${collidingEvent.title}' 
                (${collidingEvent.start} - ${collidingEvent.end}).`
            );
            return;
        }
    }
    const duration =
        (new Date(`${newDate}T${newEnd}`).getTime() -
            new Date(`${newDate}T${newStart}`).getTime()) /
        (1000 * 60);
    if (duration < 0) {
        $("#errors").text("The start cannot be after the end.");
        return;
    } else if (duration < 30) {
        $("#errors").text("Events should be at least 30 minutes.");
        return;
    }
    currentEvent.title = newTitle;
    currentEvent.start = newStart;
    currentEvent.end = newEnd;
    currentEvent.duration = duration;
    currentEvent.prevDate = currentEvent.date;
    currentEvent.date = newDate;
    currentEvent.dayIndex = getDayIndex(new Date(currentEvent.date));
    currentEvent.description = $("#eventDescription").val();
    currentEvent.color = $(".color.active").attr("data-color");
    if (mode == "create" || mode == "copy") {
        createEvent();
    } else if (mode == "edit") {
        updateEvent();
    }
    closeModal();
});

function createEvent() {
    if (!events[currentEvent.date]) {
        events[currentEvent.date] = {};
    }
    events[currentEvent.date][currentEvent.id] = currentEvent;
    saveEvents();
    showEvent(currentEvent);
}

function clickEvent() {
    const id = $(this).attr("id");
    const date = $(this).attr("data-date");
    const event = events[date][id];
    if (!event) return;
    currentEvent = event;
    mode = "edit";
    openModal();
}

function updateEvent() {
    showEvent(currentEvent);
    if (currentEvent.date != currentEvent.prevDate) {
        delete events[currentEvent.prevDate][currentEvent.id];
        if (Object.values(events[currentEvent.prevDate]).length == 0) {
            delete events[currentEvent.prevDate];
        }
        if (!events[currentEvent.date]) {
            events[currentEvent.date] = {};
        }
        events[currentEvent.date][currentEvent.id] = currentEvent;
    }
    saveEvents();
}

function showEvent(ev) {
    if (ev.date < dateString(weekStart) || ev.date > dateString(weekEnd)) {
        $(`#${ev.id}`).remove();
        return;
    }
    const startHour = parseInt(ev.start.substring(0, 2));
    const startMinutes = parseInt(ev.start.substring(3, 5));
    const endHour = parseInt(ev.end.substring(0, 2));
    const endMinutes = parseInt(ev.end.substring(3, 5));
    let eventSlot;
    if ($(`#${ev.id}`).length) {
        eventSlot = $(`#${ev.id}`);
    } else {
        eventSlot = $("<div></div>")
            .addClass("event")
            .attr("id", ev.id)
            .attr("data-date", ev.date)
            .click(clickEvent);
    }
    eventSlot
        .text(ev.title)
        .css("top", startHour * slotHeight + (startMinutes / 60) * slotHeight + 2 + "px")
        .css(
            "bottom",
            24 * slotHeight -
                (endHour * slotHeight + (endMinutes / 60) * slotHeight) +
                1 +
                "px"
        )
        .attr("data-date", ev.date)
        .css("backgroundColor", `var(--color-${ev.color})`)
        .appendTo(`.slots[data-dayIndex=${ev.dayIndex}]`);
    if (ev.duration < 45) {
        eventSlot.removeClass("shortEvent").addClass("veryShortEvent");
    } else if (ev.duration < 60) {
        eventSlot.removeClass("veryShortEvent").addClass("shortEvent");
    } else {
        eventSlot.removeClass("shortEvent").removeClass("veryShortEvent");
    }
}

function saveEvents() {
    localStorage.setItem("events", JSON.stringify(events));
}

$("#deleteButton").click(() => {
    delete events[currentEvent.date][currentEvent.id];
    if (Object.values(events[currentEvent.date]).length == 0) {
        delete events[currentEvent.date];
    }
    saveEvents();
    $(`#${currentEvent.id}`).remove();
    closeModal();
});

$("#trashButton").click(() => {
    if (readyToTrash) {
        events = {};
        saveEvents();
        loadEvents();
        readyToTrash = false;
    } else {
        readyToTrash = true;
        window.alert(
            "This will delete all the events in your calendar. This cannot be undone. If you are sure, click the trash can again in the next minute."
        );
        setTimeout(() => {
            readyToTrash = false;
        }, 60 * 1000);
    }
});

// change color

$(".color").click(function () {
    $(".color.active").removeClass("active");
    $(this).addClass("active");
    currentEvent.color = $(this).attr("data-color");
});

// week functions

$("#nextWeekBtn").click(() => {
    changeWeek(1);
});

$("#prevWeekBtn").click(() => {
    changeWeek(-1);
});

function changeWeek(number) {
    const offset = number * 1000 * 60 * 60 * 24 * 7;
    weekOffset += number;
    weekStart = new Date(weekStart.getTime() + offset);
    weekEnd = new Date(weekEnd.getTime() + offset);
    showWeek();
    loadEvents();
}

function getCurrentWeek() {
    const now = new Date();
    const firstDay = now.getDate() - getDayIndex(now);
    weekStart = new Date(now.setDate(firstDay));
    weekEnd = new Date(now.setDate(firstDay + 6));
    showWeek();
}

function showWeek() {
    $("#weekStartDisplay").text(weekStart.toLocaleDateString(undefined, dateOptions));
    $("#weekEndDisplay").text(weekEnd.toLocaleDateString(undefined, dateOptions));

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(weekStart.getTime() + dayIndex * 24 * 60 * 60 * 1000);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        $(`.day[data-dayIndex=${dayIndex}]`).find(`.dayDisplay`).text(`${day}.${month}`);
    }

    if (weekOffset == 0) {
        showCurrentDay();
    } else {
        hideCurrentDay();
    }
}

function showCurrentDay() {
    const now = new Date();
    const dayIndex = getDayIndex(now);
    $(`.day[data-dayIndex=${dayIndex}]`).children(".columnHeader").addClass("currentDay");
}

function hideCurrentDay() {
    $(".columnHeader").removeClass("currentDay");
}

// auxiliary stuff

function dateString(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function getDayIndex(date) {
    const falseIndex = date.getDay();
    return falseIndex == 0 ? 6 : falseIndex - 1;
}

function generateId(length = 20) {
    const chars = "ABCDEFGHIHJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < length; i++) {
        const rand = Math.floor(Math.random() * chars.length);
        id += chars.charAt(rand);
    }
    return id;
}
